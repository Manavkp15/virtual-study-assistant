import { Router, Request, Response } from 'express';
import https from 'https';

const router = Router();

// In-memory audio buffer cache to optimize repeated paragraph requests
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_ITEMS = 300;

/**
 * Fetch a single audio chunk from Google's high-fidelity Indic speech service
 */
function fetchChunkAudio(text: string, lang: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text.trim());
    const targetLang = lang.toLowerCase().startsWith('gu')
      ? 'gu'
      : lang.toLowerCase().startsWith('hi')
      ? 'hi'
      : 'en';

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${targetLang}&client=tw-ob`;

    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/'
        },
        timeout: 10000
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`TTS service returned HTTP status ${res.statusCode}`));
        }
        const data: Buffer[] = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => resolve(Buffer.concat(data)));
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('TTS request timed out'));
    });

    req.on('error', reject);
  });
}

/**
 * Split text into sentence-sized chunks (<= 160 chars) preserving Gujarati/Hindi/English flow
 */
function splitIntoTtsChunks(text: string, maxLen = 160): string[] {
  if (!text) return [];

  // Clean text: remove markdown symbols, weird control characters, normalize spaces
  const clean = text
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width non-joiners/spaces
    .replace(/[#*_`~[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Split on sentence terminators: periods, question marks, exclamation marks, or Indic dandas
  const sentences = clean.split(/([.!?।॥\n]+)/);
  const chunks: string[] = [];
  let current = '';

  for (let i = 0; i < sentences.length; i++) {
    const part = sentences[i];
    if (!part) continue;

    if ((current + part).length <= maxLen) {
      current += part;
    } else {
      if (current.trim()) chunks.push(current.trim());
      if (part.length <= maxLen) {
        current = part;
      } else {
        // Break long sentences on spaces or commas
        const words = part.split(/(\s+|[,;،]+)/);
        current = '';
        for (const w of words) {
          if ((current + w).length <= maxLen) {
            current += w;
          } else {
            if (current.trim()) chunks.push(current.trim());
            current = w;
          }
        }
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.filter((c) => c.length > 0);
}

/**
 * Detect script language: Gujarati, Hindi, or English
 */
function detectLanguage(text: string): 'gu' | 'hi' | 'en' {
  const guMatches = (text.match(/[\u0A80-\u0AFF]/g) || []).length;
  const hiMatches = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (guMatches > 0 && guMatches >= hiMatches) return 'gu';
  if (hiMatches > 0 && hiMatches > guMatches) return 'hi';
  return 'en';
}

/**
 * Handler for synthesizing speech into MP3 audio
 */
async function handleTtsRequest(req: Request, res: Response) {
  try {
    const text = (req.method === 'POST' ? req.body.text : req.query.text) as string;
    let lang = (req.method === 'POST' ? req.body.lang : req.query.lang) as string;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    // Auto-detect language if not explicitly set or set to 'auto'
    if (!lang || lang === 'auto') {
      lang = detectLanguage(text);
    }

    const normalizedLang = lang.toLowerCase().startsWith('gu')
      ? 'gu'
      : lang.toLowerCase().startsWith('hi')
      ? 'hi'
      : 'en';

    const cacheKey = `${normalizedLang}:${text.trim().substring(0, 150)}:${text.length}`;
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', cached.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached);
    }

    const chunks = splitIntoTtsChunks(text);
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No pronounceable text found' });
    }

    // Sequentially or concurrently fetch chunk audio buffers
    const audioBuffers: Buffer[] = [];
    for (const chunk of chunks) {
      try {
        const buf = await fetchChunkAudio(chunk, normalizedLang);
        audioBuffers.push(buf);
      } catch (err: any) {
        console.warn(`TTS chunk failed for [${chunk}]:`, err.message);
      }
    }

    if (audioBuffers.length === 0) {
      return res.status(502).json({ error: 'Failed to synthesize speech audio' });
    }

    const finalAudio = Buffer.concat(audioBuffers);

    // Store in cache
    if (audioCache.size >= MAX_CACHE_ITEMS) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, finalAudio);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', finalAudio.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(finalAudio);
  } catch (error: any) {
    console.error('TTS speech generation error:', error);
    return res.status(500).json({ error: 'Internal server error while synthesizing speech' });
  }
}

// Support both GET and POST
router.get('/tts', handleTtsRequest);
router.post('/tts', handleTtsRequest);

export default router;
