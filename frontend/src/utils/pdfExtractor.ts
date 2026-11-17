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
 * Checks if a Unicode character is an Indic combining vowel sign (matra), virama/halant, or diacritic.
 * These characters should NEVER have leading whitespace separating them from their base consonant.
 */
function isIndicCombiningChar(ch: string): boolean {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  // Gujarati combining characters: ઁ ં ઃ ઼ ા િ ી ુ ૂ ૃ ૄ ૅ ે ૈ ૉ ો ૌ ્
  if ((code >= 0x0A81 && code <= 0x0A83) || code === 0x0ABC || (code >= 0x0ABE && code <= 0x0ACD)) {
    return true;
  }
  // Devanagari combining characters: ँ ं ः ़ ा ि ी ु ू ृ ॄ ॅ ॆ े ै ॉ ॊ ो ौ ्
  if ((code >= 0x0901 && code <= 0x0903) || code === 0x093C || (code >= 0x093E && code <= 0x094D)) {
    return true;
  }
  return false;
}

/**
 * Cleans and fixes spacing in extracted Indic (Gujarati, Hindi) and English text.
 * Prevents splitting of characters, matras, and ligatures while preserving word boundaries.
 */
export function cleanAndNormalizeText(raw: string): string {
  if (!raw) return '';
  let text = raw
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width non-joiners/spaces
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Iterative multi-pass defragmenter to fix disjointed Indic vowel signs / matras / ligatures
  // This collapses any rogue spaces created by PDF glyph positioning: e.g. 'પ ુ સ ્ ત ક' -> 'પુસ્તક'
  let prev = '';
  let maxPasses = 6;
  while (prev !== text && maxPasses-- > 0) {
    prev = text;
    text = text
      // Gujarati matras separated by space from preceding consonant: ક ા -> કા, પ ુ -> પુ, etc.
      .replace(/([\u0A85-\u0AB9\u0A00-\u0AFF])\s+([\u0ABE-\u0ACD\u0A81-\u0A83\u0ABC])/g, '$1$2')
      // Gujarati halant + consonant: ક ્ ર -> ક્ર, સ ્ ત -> સ્ત
      .replace(/([\u0ACD])\s+([\u0A85-\u0AB9])/g, '$1$2')
      // Gujarati matra + anusvara: ો ં -> ોં
      .replace(/([\u0ABE-\u0ACC])\s+([\u0A81-\u0A83])/g, '$1$2')
      // Devanagari / Hindi equivalents
      .replace(/([\u0905-\u0939\u0900-\u097F])\s+([\u093E-\u094D\u0901-\u0903\u093C])/g, '$1$2')
      .replace(/([\u094D])\s+([\u0905-\u0939])/g, '$1$2')
      .replace(/([\u093E-\u094C])\s+([\u0901-\u0903])/g, '$1$2');
  }

  return text
    // Remove space before punctuation
    .replace(/\s+([.,!?:;।॥])/g, '$1')
    // Remove space inside brackets: ( ૧ ) -> (૧)
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    // Normalize excessive horizontal spaces while preserving line breaks
    .replace(/[ \t]{2,}/g, ' ')
    // Normalize excessive consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts page-by-page text and segmented paragraphs from an uploaded PDF file or ArrayBuffer.
 * Configured with local CMaps and font decoders to accurately reconstruct Gujarati, Hindi, and English text.
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

  // Configure CMaps for Indic CID fonts (Gujarati, Hindi, Sanskrit, etc.)
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: '/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/standard_fonts/'
  });

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
        const dx = tx - (lastX + lastWidth);

        // Check for Indic characters: matras and virama conjuncts must NEVER have leading spaces
        const startsWithIndicMatra = isIndicCombiningChar(str.charAt(0));
        const lastChar = pageText.slice(-1);
        const endsWithVirama = lastChar === '\u0ACD' || lastChar === '\u094D';

        // In Indic scripts, glyph kerning dx is small; only genuine word separations should add space
        const isIndicContinuation = startsWithIndicMatra || endsWithVirama;
        const requiresSpace = !isIndicContinuation && (dx > height * 0.32);

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
          : ['']
    });
  }

  return {
    fileName: name,
    numPages,
    pages,
    totalWords
  };
}
