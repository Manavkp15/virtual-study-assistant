import { prisma } from '../database/prisma';

export interface PerformancePrediction {
  predictedNextScore: number;
  confidenceScore: number;
  trendDirection: 'IMPROVING' | 'STABLE' | 'DECLINING';
  trendDirectionGu: string;
  subjectPredictions: Array<{
    subjectName: string;
    subjectNameGu?: string;
    currentAverage: number;
    predictedNextScore: number;
    expectedGrade: string;
    expectedGradeGu: string;
  }>;
  persistentWeakTopics: string[];
  persistentWeakTopicsGu: string[];
  recommendationSummary: string;
  recommendationSummaryGu: string;
}

export async function predictPerformance(userId: string): Promise<PerformancePrediction> {
  const attempts = await prisma.testAttempt.findMany({
    where: { userId },
    include: {
      test: {
        include: {
          subject: true
        }
      }
    },
    orderBy: { completedAt: 'asc' }
  });

  if (attempts.length === 0) {
    return {
      predictedNextScore: 70.0,
      confidenceScore: 50,
      trendDirection: 'STABLE',
      trendDirectionGu: 'સ્થિર',
      subjectPredictions: [],
      persistentWeakTopics: [],
      persistentWeakTopicsGu: [],
      recommendationSummary: 'Attempt more tests to generate personalized performance predictions.',
      recommendationSummaryGu: 'વ્યક્તિગત પ્રદર્શન અનુમાન મેળવવા માટે વધુ ટેસ્ટ આપો.'
    };
  }

  // 1. Calculate Weighted Moving Average & Linear Regression over past percentages
  const n = attempts.length;
  const percentages = attempts.map(a => a.percentage);

  // Linear regression: y = m*x + c where x is index 0..n-1
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  percentages.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  let slope = 0;
  if (n > 1) {
    slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  // Weighted moving average (more weight on recent tests)
  let weightedSum = 0;
  let weightTotal = 0;
  percentages.forEach((val, idx) => {
    const weight = idx + 1;
    weightedSum += val * weight;
    weightTotal += weight;
  });
  const wma = weightedSum / weightTotal;

  // Forecast next score = 0.7 * WMA + 0.3 * (LastScore + Slope)
  const lastScore = percentages[percentages.length - 1];
  const linearEst = lastScore + slope;
  let predictedNextScore = Math.min(100, Math.max(0, Math.round((0.7 * wma + 0.3 * linearEst) * 10) / 10));

  let trendDirection: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
  let trendDirectionGu = 'સ્થિર';
  if (slope > 1.5) {
    trendDirection = 'IMPROVING';
    trendDirectionGu = 'સુધરી રહ્યું છે';
  } else if (slope < -1.5) {
    trendDirection = 'DECLINING';
    trendDirectionGu = 'ઘટી રહ્યું છે';
  }

  // 2. Subject Expected Performance
  const subjectMap = new Map<string, { scores: number[]; nameGu?: string }>();
  attempts.forEach((att) => {
    const sub = att.test.subject;
    const existing = subjectMap.get(sub.name) || { scores: [], nameGu: sub.nameGu || sub.name };
    existing.scores.push(att.percentage);
    subjectMap.set(sub.name, existing);
  });

  const subjectPredictions = Array.from(subjectMap.entries()).map(([subName, data]) => {
    const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    const recent = data.scores[data.scores.length - 1];
    const subPredicted = Math.min(100, Math.max(0, Math.round((0.6 * recent + 0.4 * avg) * 10) / 10));

    let grade = 'C';
    let gradeGu = 'C';
    if (subPredicted >= 90) { grade = 'A+'; gradeGu = 'A+'; }
    else if (subPredicted >= 80) { grade = 'A'; gradeGu = 'A'; }
    else if (subPredicted >= 70) { grade = 'B'; gradeGu = 'B'; }
    else if (subPredicted >= 60) { grade = 'C'; gradeGu = 'C'; }
    else { grade = 'D (Needs Revision)'; gradeGu = 'D (પુનરાવર્તન જરૂરી)'; }

    return {
      subjectName: subName,
      subjectNameGu: data.nameGu,
      currentAverage: Math.round(avg * 10) / 10,
      predictedNextScore: subPredicted,
      expectedGrade: grade,
      expectedGradeGu: gradeGu
    };
  });

  // 3. Persistent Weak Topics
  const weakPerformances = await prisma.topicPerformance.findMany({
    where: {
      userId,
      status: { in: ['CRITICAL', 'NEEDS_IMPROVEMENT'] }
    },
    include: {
      topic: true
    }
  });

  const persistentWeakTopics = weakPerformances.map(p => p.topic.name);
  const persistentWeakTopicsGu = weakPerformances.map(p => p.topic.nameGu || p.topic.name);

  const confidenceScore = Math.min(95, Math.max(60, 60 + n * 5));

  let recommendationSummary = '';
  let recommendationSummaryGu = '';
  if (trendDirection === 'IMPROVING') {
    recommendationSummary = `Your trajectory is positive! Keep up your current pace to reach an estimated ${predictedNextScore}% on your next test.`;
    recommendationSummaryGu = `તમારી પ્રગતિ હકારાત્મક છે! તમારી આગામી કસોટીમાં અંદાજિત ${predictedNextScore}% સુધી પહોંચવા માટે તમારી વર્તમાન ગતિ જાળવી રાખો.`;
  } else if (trendDirection === 'DECLINING') {
    recommendationSummary = `Performance regression detected in recent tests. Focus on weak topics (${persistentWeakTopics.slice(0, 2).join(', ')}) immediately to halt score drop.`;
    recommendationSummaryGu = `તાજેતરના ટેસ્ટમાં સ્કોરમાં ઘટાડો નોંધાયો છે. સ્કોર ઘટતો અટકાવવા માટે નબળા વિષયો (${persistentWeakTopicsGu.slice(0, 2).join(', ')}) પર તાત્કાલિક ધ્યાન આપો.`;
  } else {
    recommendationSummary = `Consistent score stability at ~${predictedNextScore}%. Targeted practice on weak topics will push your scores past target levels.`;
    recommendationSummaryGu = `લગભગ ~${predictedNextScore}% પર પ્રદર્શન સ્થિર છે. નબળા વિષયો પર લક્ષ્યાંકિત પ્રેક્ટિસ તમારા સ્કોરને લક્ષ્યાંક કરતા આગળ લઈ જશે.`;
  }

  return {
    predictedNextScore,
    confidenceScore,
    trendDirection,
    trendDirectionGu,
    subjectPredictions,
    persistentWeakTopics,
    persistentWeakTopicsGu,
    recommendationSummary,
    recommendationSummaryGu
  };
}
