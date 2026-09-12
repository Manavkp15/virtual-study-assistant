import { prisma } from '../database/prisma';

export interface TopicAssessment {
  topicId: string;
  topicName: string;
  topicNameGu?: string;
  subjectName: string;
  subjectNameGu?: string;
  chapterName: string;
  chapterNameGu?: string;
  accuracy: number;
  attemptCount: number;
  repeatedMistakes: number;
  totalQuestionsAttempted: number;
  totalCorrect: number;
  status: 'EXCELLENT' | 'STRONG' | 'AVERAGE' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  reason?: string;
  reasonGu?: string;
  recommendation: string;
  recommendationGu: string;
  lastEvaluatedAt: Date;
}

export async function detectWeakTopics(userId: string): Promise<{
  allTopics: TopicAssessment[];
  weakTopics: TopicAssessment[];
  strongTopics: TopicAssessment[];
}> {
  const performances = await prisma.topicPerformance.findMany({
    where: { userId },
    include: {
      topic: {
        include: {
          chapter: {
            include: {
              subject: true
            }
          }
        }
      }
    }
  });

  const assessedTopics: TopicAssessment[] = performances.map((perf) => {
    const accuracy = perf.accuracy;
    const repeated = perf.repeatedMistakes;
    const topicName = perf.topic.name;
    const topicNameGu = perf.topic.nameGu || topicName;

    let status: 'EXCELLENT' | 'STRONG' | 'AVERAGE' | 'NEEDS_IMPROVEMENT' | 'CRITICAL' = 'AVERAGE';
    let reason = 'Normal performance progression observed.';
    let reasonGu = 'સામાન્ય પ્રદર્શન પ્રગતિ નોંધાયેલ છે.';
    let recommendation = '';
    let recommendationGu = '';

    if (accuracy < 45 || repeated >= 3) {
      status = 'CRITICAL';
      reason = 'You have made repeated mistakes in this topic across multiple tests.';
      reasonGu = 'તમે અનેક ટેસ્ટમાં આ વિષયમાં વારંવાર ભૂલો કરી છે.';
      recommendation = `Review basic identities and solve 15 easy questions in ${topicName}.`;
      recommendationGu = `મૂળભૂત ${topicNameGu} ની ઓળખોનું પુનરાવર્તન કરો અને 15 સરળ પ્રશ્નો ઉકેલો.`;
    } else if (accuracy >= 45 && accuracy < 60 || repeated === 2) {
      status = 'NEEDS_IMPROVEMENT';
      reason = 'Accuracy is below 60% with recurring concept confusion.';
      reasonGu = 'ચોકસાઈ 60% કરતાં ઓછી છે અને ખ્યાલોમાં વારંવાર ગૂંચવણ થાય છે.';
      recommendation = `Practice foundational problems in ${topicName} to eliminate recurring errors.`;
      recommendationGu = `વારંવાર થતી ભૂલો દૂર કરવા માટે ${topicNameGu} ના પાયાના પ્રશ્નોની પ્રેક્ટિસ કરો.`;
    } else if (accuracy >= 60 && accuracy < 75) {
      status = 'AVERAGE';
      reason = 'Moderate performance with room for higher score improvement.';
      reasonGu = 'મધ્યમ પ્રદર્શન, વધુ સારો સ્કોર મેળવવાની તક છે.';
      recommendation = `Good progress! Review medium-difficulty questions in ${topicName} to boost accuracy.`;
      recommendationGu = `સારી પ્રગતિ! ચોકસાઈ વધારવા માટે ${topicNameGu} ના મધ્યમ કઠિનતાવાળા પ્રશ્નોનું પુનરાવર્તન કરો.`;
    } else if (accuracy >= 75 && accuracy < 88) {
      status = 'STRONG';
      reason = 'Solid understanding demonstrated across tested questions.';
      reasonGu = 'પરીક્ષણ કરાયેલા પ્રશ્નોમાં મજબૂત સમજ દર્શાવી છે.';
      recommendation = `Strong mastery demonstrated in ${topicName}. Maintain speed and precision.`;
      recommendationGu = `${topicNameGu} માં મજબૂત પકડ દર્શાવી છે. ઝડપ અને ચોકસાઈ જાળવી રાખો.`;
    } else {
      status = 'EXCELLENT';
      reason = 'Exceptional accuracy with no repeated errors.';
      reasonGu = 'કોઈ પણ વારંવાર થતી ભૂલો વગર અસાધારણ ચોકસાઈ.';
      recommendation = `Outstanding performance in ${topicName}! Ready for challenge level tests.`;
      recommendationGu = `${topicNameGu} માં ઉત્કૃષ્ટ પ્રદર્શન! ચેલેન્જ લેવલના ટેસ્ટ માટે તૈયાર.`;
    }

    return {
      topicId: perf.topicId,
      topicName,
      topicNameGu,
      subjectName: perf.topic.chapter.subject.name,
      subjectNameGu: perf.topic.chapter.subject.nameGu || perf.topic.chapter.subject.name,
      chapterName: perf.topic.chapter.name,
      chapterNameGu: perf.topic.chapter.nameGu || perf.topic.chapter.name,
      accuracy: Math.round(accuracy * 10) / 10,
      attemptCount: perf.attemptCount,
      repeatedMistakes: perf.repeatedMistakes,
      totalQuestionsAttempted: perf.totalQuestionsAttempted,
      totalCorrect: perf.totalCorrect,
      status,
      reason,
      reasonGu,
      recommendation,
      recommendationGu,
      lastEvaluatedAt: perf.lastEvaluatedAt
    };
  });

  const weakTopics = assessedTopics.filter(t => t.status === 'CRITICAL' || t.status === 'NEEDS_IMPROVEMENT');
  const strongTopics = assessedTopics.filter(t => t.status === 'STRONG' || t.status === 'EXCELLENT');

  return {
    allTopics: assessedTopics,
    weakTopics,
    strongTopics
  };
}

export async function updateStudentTopicPerformance(
  userId: string,
  topicId: string,
  newCorrectCount: number,
  newTotalCount: number,
  repeatedMistakesToAdd: number = 0
) {
  const existing = await prisma.topicPerformance.findUnique({
    where: { userId_topicId: { userId, topicId } }
  });

  const totalQuestionsAttempted = (existing?.totalQuestionsAttempted || 0) + newTotalCount;
  const totalCorrect = (existing?.totalCorrect || 0) + newCorrectCount;
  const attemptCount = (existing?.attemptCount || 0) + 1;
  const repeatedMistakes = (existing?.repeatedMistakes || 0) + repeatedMistakesToAdd;
  const accuracy = totalQuestionsAttempted > 0 ? (totalCorrect / totalQuestionsAttempted) * 100 : 0;

  let status = 'AVERAGE';
  if (accuracy < 45 || repeatedMistakes >= 3) status = 'CRITICAL';
  else if (accuracy < 60 || repeatedMistakes === 2) status = 'NEEDS_IMPROVEMENT';
  else if (accuracy < 75) status = 'AVERAGE';
  else if (accuracy < 88) status = 'STRONG';
  else status = 'EXCELLENT';

  return await prisma.topicPerformance.upsert({
    where: { userId_topicId: { userId, topicId } },
    update: {
      totalQuestionsAttempted,
      totalCorrect,
      attemptCount,
      repeatedMistakes,
      accuracy,
      status,
      lastEvaluatedAt: new Date()
    },
    create: {
      userId,
      topicId,
      totalQuestionsAttempted,
      totalCorrect,
      attemptCount,
      repeatedMistakes,
      accuracy,
      status,
      lastEvaluatedAt: new Date()
    }
  });
}
