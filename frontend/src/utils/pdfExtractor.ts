import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Configure local Vite-bundled worker to ensure fast, offline extraction without CDN dependencies
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  paragraphs: string[];
}

export interface ExtractedPdf {
  fileName: string;
  numPages: number;
  pages: ExtractedPage[];
  totalWords: number;
}

/**
 * Cleans and fixes spacing in extracted Indic (Gujarati, Hindi) and English text.
 * Prevents splitting of characters, matras, and ligatures while preserving word boundaries.
 */
function cleanAndNormalizeText(raw: string): string {
  if (!raw) return '';
  return raw
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Fix disjointed Indic vowel signs / matras that were detached by rogue spaces
    // Gujarati matras: ા િ ી ુ ૂ ૃ ૄ ૅ ે ૈ ૉ ો ૌ ્ ં ઃ ઼
    .replace(/([\u0A85-\u0AB9])\s+([\u0ABE-\u0ACD\u0A81-\u0A83\u0ABC])/g, '$1$2')
    .replace(/([\u0A85-\u0AB9]\u0ACD)\s+([\u0A85-\u0AB9])/g, '$1$2')
    .replace(/([\u0ABE-\u0ACC])\s+([\u0A81-\u0A83])/g, '$1$2')
    // Devanagari/Hindi matras: ा ि ी ु ू ृ ॄ ॅ ॆ े ै ॉ ॊ ो ौ ् ं ः ़
    .replace(/([\u0905-\u0939])\s+([\u093E-\u094D\u0901-\u0903\u093C])/g, '$1$2')
    .replace(/([\u0905-\u0939]\u094D)\s+([\u0905-\u0939])/g, '$1$2')
    .replace(/([\u093E-\u094C])\s+([\u0901-\u0903])/g, '$1$2')
    // Remove space before punctuation
    .replace(/\s+([.,!?:;।॥])/g, '$1')
    // Normalize excessive spaces
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Extracts page-by-page text and segmented paragraphs from an uploaded PDF file or ArrayBuffer.
 * Accurately reconstructs Gujarati, Hindi, and English sentences without breaking words.
 */
export async function extractTextFromPdf(
  fileOrBuffer: File | ArrayBuffer,
  fileName?: string
): Promise<ExtractedPdf> {
  let arrayBuffer: ArrayBuffer;
  let name = fileName || 'study_material.pdf';

  if (fileOrBuffer instanceof File) {
    name = fileOrBuffer.name;
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else {
    arrayBuffer = fileOrBuffer;
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const pages: ExtractedPage[] = [];
  let totalWords = 0;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();

    const items = textContent.items as Array<{
      str?: string;
      hasEOL?: boolean;
      transform?: number[];
      width?: number;
      height?: number;
    }>;

    let pageText = '';
    let lastY: number | null = null;
    let lastX: number | null = null;
    let lastWidth: number = 0;

    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      const str = item.str || '';
      if (!str) {
        if (item.hasEOL && !pageText.endsWith('\n')) {
          pageText += '\n';
        }
        continue;
      }

      const tx = item.transform ? item.transform[4] : null;
      const ty = item.transform ? item.transform[5] : null;
      const width = item.width || 0;
      const height = item.height || 10;

      if (lastY !== null && ty !== null && Math.abs(ty - lastY) > height * 0.45) {
        // Vertical displacement indicates a line change
        if (!pageText.endsWith('\n') && !pageText.endsWith(' ')) {
          pageText += '\n';
        }
      } else if (lastX !== null && tx !== null) {
        // Horizontal displacement check to determine genuine word boundaries
        const dx = tx - (lastX + lastWidth);
        const requiresSpace = dx > height * 0.18;

        if (
          requiresSpace &&
          !pageText.endsWith(' ') &&
          !pageText.endsWith('\n') &&
          !str.startsWith(' ')
        ) {
          pageText += ' ';
        }
      }

      pageText += str;

      if (item.hasEOL && !pageText.endsWith('\n')) {
        pageText += '\n';
      }

      lastX = tx;
      lastY = ty;
      lastWidth = width;
    }

    const fullPageText = cleanAndNormalizeText(pageText);

    // Split raw text by line breaks
    const rawLines = fullPageText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Merge short wrapped lines into coherent, natural reading paragraphs
    const paragraphs: string[] = [];
    let currentParagraph = '';

    for (const line of rawLines) {
      if (!currentParagraph) {
        currentParagraph = line;
      } else if (
        currentParagraph.length < 180 &&
        !/[.!?:\u0964\u0965]$/.test(currentParagraph.trim())
      ) {
        currentParagraph += ' ' + line;
      } else {
        paragraphs.push(cleanAndNormalizeText(currentParagraph));
        currentParagraph = line;
      }
    }
    if (currentParagraph) {
      paragraphs.push(cleanAndNormalizeText(currentParagraph));
    }

    const pageWordCount = fullPageText.split(/\s+/).filter(Boolean).length;
    totalWords += pageWordCount;

    pages.push({
      pageNumber: i,
      text: fullPageText,
      paragraphs:
        paragraphs.length > 0
          ? paragraphs
          : fullPageText
          ? [fullPageText]
          : ['[No readable text detected on this page]']
    });
  }

  return {
    fileName: name,
    numPages,
    pages,
    totalWords
  };
}
