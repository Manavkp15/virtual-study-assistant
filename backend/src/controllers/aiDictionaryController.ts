import { Response } from 'express';
import { prisma } from '../database/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { lookupWord } from '../ai/aiDictionaryService';

export async function searchWord(req: AuthenticatedRequest, res: Response) {
  try {
    const { word, language = 'en', subject, chapter, topic } = req.body;

    if (!word || typeof word !== 'string' || !word.trim()) {
      return res.status(400).json({
        success: false,
        found: false,
        error: 'Word is required',
        message: 'Please provide a valid word to search.'
      });
    }

    const cleanWord = word.trim();
    const normalizedKey = cleanWord.toLowerCase();
    const cacheSubjectKey = subject ? subject.trim().toLowerCase() : 'all';

    // 1. Check cache first
    let cachedResult = null;
    try {
      const cached = await prisma.dictionaryCache.findUnique({
        where: {
          word_language_subject: {
            word: normalizedKey,
            language: language || 'en',
            subject: cacheSubjectKey
          }
        }
      });
      if (cached) {
        cachedResult = JSON.parse(cached.responseJson);
      }
    } catch (cacheErr) {
      // Non-blocking cache lookup error
      console.warn('Cache lookup non-blocking warning:', cacheErr);
    }

    let searchResult;
    if (cachedResult) {
      searchResult = cachedResult;
    } else {
      searchResult = await lookupWord(cleanWord, { subject, chapter, topic, language });

      // If valid found entry, cache it asynchronously
      if (searchResult.found && searchResult.entry) {
        prisma.dictionaryCache.upsert({
          where: {
            word_language_subject: {
              word: normalizedKey,
              language: language || 'en',
              subject: cacheSubjectKey
            }
          },
          update: {
            responseJson: JSON.stringify(searchResult),
            cachedAt: new Date()
          },
          create: {
            word: normalizedKey,
            language: language || 'en',
            subject: cacheSubjectKey,
            responseJson: JSON.stringify(searchResult)
          }
        }).catch(err => console.warn('Cache upsert non-blocking warning:', err));
      }
    }

    // 2. Track search history if user is authenticated
    let isSaved = false;
    let savedWordId: string | null = null;

    if (req.user?.id) {
      const studentId = req.user.id;

      // Asynchronously log search
      prisma.dictionarySearch.create({
        data: {
          studentId,
          word: cleanWord,
          language: language || 'en',
          subject: subject || null,
          chapter: chapter || null,
          topic: topic || null
        }
      }).catch(err => console.warn('Search history logging non-blocking warning:', err));

      // Check if word is already saved in My Vocabulary
      try {
        const existingSaved = await prisma.savedWord.findFirst({
          where: {
            studentId,
            word: {
              equals: cleanWord
            }
          }
        });
        if (existingSaved) {
          isSaved = true;
          savedWordId = existingSaved.id;
        }
      } catch (savedErr) {
        console.warn('Check saved word error:', savedErr);
      }
    }

    return res.json({
      success: true,
      ...searchResult,
      isSaved,
      savedWordId
    });
  } catch (error: any) {
    console.error('Error in searchWord:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search dictionary',
      message: error.message || 'An unexpected error occurred'
    });
  }
}

export async function getSavedWords(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { search, subject } = req.query;

    const whereClause: any = { studentId };

    if (subject && typeof subject === 'string' && subject !== 'ALL') {
      whereClause.subject = subject;
    }

    if (search && typeof search === 'string' && search.trim()) {
      whereClause.OR = [
        { word: { contains: search.trim() } },
        { meaning: { contains: search.trim() } },
        { meaningGu: { contains: search.trim() } }
      ];
    }

    const savedWords = await prisma.savedWord.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    const parsedSavedWords = savedWords.map(w => ({
      ...w,
      exampleSentences: w.exampleSentences ? JSON.parse(w.exampleSentences) : [],
      synonyms: w.synonyms ? JSON.parse(w.synonyms) : [],
      antonyms: w.antonyms ? JSON.parse(w.antonyms) : [],
      relatedWords: w.relatedWords ? JSON.parse(w.relatedWords) : []
    }));

    return res.json({
      success: true,
      savedWords: parsedSavedWords
    });
  } catch (error: any) {
    console.error('Error in getSavedWords:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch saved words' });
  }
}

export async function saveWord(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      word,
      meaning,
      pronunciation,
      partOfSpeech,
      simpleMeaning,
      detailedMeaning,
      exampleSentences,
      synonyms,
      antonyms,
      relatedWords,
      explainSimply,
      explainForExam,
      meaningGu,
      simpleMeaningGu,
      language = 'en',
      subject,
      chapter,
      topic
    } = req.body;

    if (!word || !meaning) {
      return res.status(400).json({ success: false, error: 'Word and meaning are required' });
    }

    const cleanWord = word.trim();

    // Check if already saved
    const existing = await prisma.savedWord.findFirst({
      where: {
        studentId,
        word: cleanWord
      }
    });

    if (existing) {
      return res.json({
        success: true,
        savedWord: existing,
        message: 'Word is already saved in My Vocabulary'
      });
    }

    const newSavedWord = await prisma.savedWord.create({
      data: {
        studentId,
        word: cleanWord,
        meaning,
        pronunciation: pronunciation || null,
        partOfSpeech: partOfSpeech || null,
        simpleMeaning: simpleMeaning || null,
        detailedMeaning: detailedMeaning || null,
        exampleSentences: exampleSentences ? JSON.stringify(exampleSentences) : null,
        synonyms: synonyms ? JSON.stringify(synonyms) : null,
        antonyms: antonyms ? JSON.stringify(antonyms) : null,
        relatedWords: relatedWords ? JSON.stringify(relatedWords) : null,
        explainSimply: explainSimply || null,
        explainForExam: explainForExam || null,
        meaningGu: meaningGu || null,
        simpleMeaningGu: simpleMeaningGu || null,
        language: language || 'en',
        subject: subject || null,
        chapter: chapter || null,
        topic: topic || null
      }
    });

    return res.status(201).json({
      success: true,
      savedWord: newSavedWord,
      message: 'Word successfully saved to My Vocabulary'
    });
  } catch (error: any) {
    console.error('Error in saveWord:', error);
    return res.status(500).json({ success: false, error: 'Failed to save word' });
  }
}

export async function removeSavedWord(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;

    const existing = await prisma.savedWord.findFirst({
      where: {
        id,
        studentId
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Saved word not found' });
    }

    await prisma.savedWord.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Word removed from My Vocabulary'
    });
  } catch (error: any) {
    console.error('Error in removeSavedWord:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove saved word' });
  }
}

export async function getRecentSearches(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get latest 10 unique searches
    const searches = await prisma.dictionarySearch.findMany({
      where: { studentId },
      orderBy: { searchedAt: 'desc' },
      take: 25
    });

    // Deduplicate by word
    const seenWords = new Set<string>();
    const uniqueSearches: typeof searches = [];
    for (const s of searches) {
      const lower = s.word.toLowerCase();
      if (!seenWords.has(lower)) {
        seenWords.add(lower);
        uniqueSearches.push(s);
        if (uniqueSearches.length >= 10) break;
      }
    }

    return res.json({
      success: true,
      recentSearches: uniqueSearches
    });
  } catch (error: any) {
    console.error('Error in getRecentSearches:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch recent searches' });
  }
}

export async function clearSearchHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const studentId = req.user?.id;
    if (!studentId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    await prisma.dictionarySearch.deleteMany({
      where: { studentId }
    });

    return res.json({
      success: true,
      message: 'Search history cleared successfully'
    });
  } catch (error: any) {
    console.error('Error in clearSearchHistory:', error);
    return res.status(500).json({ success: false, error: 'Failed to clear search history' });
  }
}
