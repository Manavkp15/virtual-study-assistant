import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';
import { HOMEWORK_UPLOAD_DIR } from '../services/fileStorage';

export interface ExtractedPageData {
  pageNumber: number;
  imagePath: string;
  processedPath?: string;
  rawText: string;
  isLegible: boolean;
  unreadableReason?: string;
  confidence: number;
}

export interface OCRProcessingResult {
  fullText: string;
  pages: ExtractedPageData[];
  overallConfidence: number;
  isHandwritingLegible: boolean;
  language: string;
}

/**
 * Check if a file is an image
 */
export function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext);
}

/**
 * Check if a file is a PDF
 */
export function isPdfFile(filename: string): boolean {
  return path.extname(filename).toLowerCase() === '.pdf';
}

/**
 * Clean and normalize OCR extracted text
 */
function cleanExtractedText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Assess legibility of extracted text
 */
function assessLegibility(text: string, ocrConfidence: number): { isLegible: boolean; reason?: string } {
  const trimmed = text.trim();
  if (trimmed.length < 5) {
    return {
      isLegible: false,
      reason: 'Handwriting could not be read clearly. Page contains insufficient recognized characters.'
    };
  }

  // Count alphanumeric vs weird gibberish characters
  const alphanumericCount = (trimmed.match(/[a-zA-Z0-9\u0A80-\u0AFF\u0900-\u097F]/g) || []).length;
  const ratio = alphanumericCount / trimmed.length;

  if (ratio < 0.40 && ocrConfidence < 50) {
    return {
      isLegible: false,
      reason: 'Handwriting could not be read clearly. Recognition confidence is too low.'
    };
  }

  return { isLegible: true };
}

/**
 * Optional Gemini Vision Multimodal handwriting extraction
 */
async function extractWithGeminiVision(
  imagePath: string,
  pageNumber: number,
  language: string,
  apiKey: string
): Promise<{ text: string; confidence: number; isLegible: boolean } | null> {
  try {
    if (!fs.existsSync(imagePath)) return null;
    const fileBytes = fs.readFileSync(imagePath);
    const base64Data = fileBytes.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    const prompt = `You are an expert handwritten student homework reader.
Carefully read the handwriting in this image (Page ${pageNumber}) written by a school student in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.
Transcribe all student answers exactly as written, preserving Question Numbers (e.g. Q1, Q2, Question 1, Ans 1, 1., 2.) and sections.
If the handwriting is completely illegible or blurry, state: "UNCLEAR_HANDWRITING".
Return ONLY the transcribed text without conversational commentary.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048
      }
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!res.ok) {
      console.warn(`[OCR Vision] Gemini Vision HTTP error: ${res.status}`);
      return null;
    }

    const data: any = await res.json();
    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (textOutput.includes('UNCLEAR_HANDWRITING') || textOutput.length < 5) {
      return {
        text: textOutput.replace('UNCLEAR_HANDWRITING', '').trim(),
        confidence: 40,
        isLegible: false
      };
    }

    return {
      text: textOutput,
      confidence: 95,
      isLegible: true
    };
  } catch (err: any) {
    console.warn('[OCR Vision] Gemini Vision call failed:', err.message);
    return null;
  }
}

/**
 * Local OCR using Tesseract.js
 */
async function extractWithTesseract(
  imagePath: string,
  language: string
): Promise<{ text: string; confidence: number; isLegible: boolean }> {
  try {
    // Determine tesseract language model: 'eng', 'guj', 'hin' or combined
    const tessLang = language === 'gu' ? 'eng+guj' : language === 'hi' ? 'eng+hin' : 'eng';

    const result = await Tesseract.recognize(imagePath, tessLang, {
      logger: () => {}
    });

    const text = cleanExtractedText(result?.data?.text || '');
    const confidence = Math.round(result?.data?.confidence || 70);
    const legibility = assessLegibility(text, confidence);

    return {
      text,
      confidence,
      isLegible: legibility.isLegible
    };
  } catch (err: any) {
    console.warn('[OCR Vision] Tesseract extraction error:', err.message);
    return {
      text: '',
      confidence: 20,
      isLegible: false
    };
  }
}

/**
 * Process a single uploaded image page
 */
export async function processHomeworkPageImage(
  imagePath: string,
  pageNumber: number,
  language: string = 'en'
): Promise<ExtractedPageData> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // 1. Try Gemini Vision if available
  if (apiKey && apiKey.length > 10) {
    const geminiRes = await extractWithGeminiVision(imagePath, pageNumber, language, apiKey);
    if (geminiRes && geminiRes.text.length > 0) {
      return {
        pageNumber,
        imagePath,
        rawText: cleanExtractedText(geminiRes.text),
        isLegible: geminiRes.isLegible,
        unreadableReason: geminiRes.isLegible ? undefined : 'Handwriting could not be read clearly. Teacher review required.',
        confidence: geminiRes.confidence
      };
    }
  }

  // 2. Use Tesseract.js
  const tessRes = await extractWithTesseract(imagePath, language);
  return {
    pageNumber,
    imagePath,
    rawText: tessRes.text,
    isLegible: tessRes.isLegible,
    unreadableReason: tessRes.isLegible ? undefined : 'Handwriting could not be read clearly. Teacher review required.',
    confidence: tessRes.confidence
  };
}

/**
 * Process multi-page student submission
 */
export async function processSubmissionFiles(
  filePaths: string[],
  language: string = 'en'
): Promise<OCRProcessingResult> {
  const pages: ExtractedPageData[] = [];
  let fullText = '';
  let totalConfidence = 0;

  for (let idx = 0; idx < filePaths.length; idx++) {
    const filePath = filePaths[idx];
    const pageNumber = idx + 1;

    if (isImageFile(filePath)) {
      const pageData = await processHomeworkPageImage(filePath, pageNumber, language);
      pages.push(pageData);
      fullText += `\n--- Page ${pageNumber} ---\n` + pageData.rawText;
      totalConfidence += pageData.confidence;
    } else if (isPdfFile(filePath)) {
      // PDF handling: attempt text extraction or tesseract fallback
      let pdfText = '';
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          // Basic extract if contains ASCII text streams
          const matches = content.match(/\(([^()]{3,})\)[\s]*Tj/g) || [];
          if (matches.length > 0) {
            pdfText = matches.map(m => m.replace(/[\(\)Tj]/g, '').trim()).join(' ');
          }
        }
      } catch (e) {
        // ignore
      }

      if (!pdfText || pdfText.trim().length < 10) {
        // Run OCR on PDF file directly with Tesseract
        try {
          const res = await extractWithTesseract(filePath, language);
          pdfText = res.text;
        } catch (e) {
          pdfText = '';
        }
      }

      const isLegible = pdfText.trim().length >= 10;
      pages.push({
        pageNumber,
        imagePath: filePath,
        rawText: cleanExtractedText(pdfText),
        isLegible,
        unreadableReason: isLegible ? undefined : 'PDF document could not be extracted clearly. Teacher review required.',
        confidence: isLegible ? 85 : 30
      });
      fullText += `\n--- Page ${pageNumber} ---\n` + pdfText;
      totalConfidence += isLegible ? 85 : 30;
    }
  }

  const avgConfidence = pages.length > 0 ? Math.round(totalConfidence / pages.length) : 0;
  const isHandwritingLegible = pages.some(p => p.isLegible && p.rawText.trim().length > 15);

  return {
    fullText: fullText.trim(),
    pages,
    overallConfidence: avgConfidence,
    isHandwritingLegible,
    language
  };
}
