import { prisma } from '../database/prisma';
import { calculateStudentAnalytics } from '../algorithms/analyticsEngine';
import { detectWeakTopics } from '../algorithms/weakTopicDetector';
import { predictPerformance } from '../algorithms/predictionEngine';

export interface AIGuidanceSummary {
  personalizedFeedback: string;
  weakTopicExplanation: string;
  studyRecommendations: string[];
  revisionRecommendations: string[];
  recommendedTest: string;
  learningPriorities: string[];
  performanceSummary: string;
  motivationMessage: string;
  nextStepGuidance: string;
}

export async function generateAIGuidance(userId: string, lang: string = 'en'): Promise<AIGuidanceSummary> {
  const isGu = lang === 'gu';
  const analytics = await calculateStudentAnalytics(userId);
  const weakData = await detectWeakTopics(userId);
  const prediction = await predictPerformance(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  const studentName = user?.name || (isGu ? 'વિદ્યાર્થી' : 'Student');
  const streak = user?.profile?.streakCount || 1;
  const overallAcc = analytics.accuracy;

  let personalizedFeedback = '';
  let weakTopicExplanation = '';
  let studyRecommendations: string[] = [];
  let revisionRecommendations: string[] = [];
  let recommendedTest = '';
  let learningPriorities: string[] = [];
  let performanceSummary = '';
  let motivationMessage = '';
  let nextStepGuidance = '';

  if (isGu) {
    personalizedFeedback = `નમસ્તે ${studentName}! ${analytics.testsCompleted} ટેસ્ટમાં તમારો સરેરાશ સ્કોર ${analytics.averagePercentage}% છે અને તમારી ચોકસાઈ ${overallAcc}% છે. `;
    if (analytics.improvementRate > 0) {
      personalizedFeedback += `સરસ કામ! તમારા શરૂઆતના ટેસ્ટની સરખામણીમાં તમારા પ્રદર્શનમાં ${analytics.improvementRate}% નો સુધારો થયો છે.`;
    } else if (analytics.improvementRate < 0) {
      personalizedFeedback += `અમે તમારા તાજેતરના સ્કોરમાં ${Math.abs(analytics.improvementRate)}% નો ઘટાડો જોયો છે. લક્ષ્યાંકિત પુનરાવર્તનથી તમારી પ્રગતિ પાછી મેળવવામાં મદદ મળશે.`;
    } else {
      personalizedFeedback += `તમારા ગુણ સ્થિર રહ્યા છે. નબળા વિષયો પર ધ્યાન કેન્દ્રિત કરીને તમે વધુ સારો સ્કોર મેળવી શકો છો.`;
    }

    if (weakData.weakTopics.length > 0) {
      const topWeak = weakData.weakTopics[0];
      const sName = topWeak.subjectNameGu || topWeak.subjectName;
      const tName = topWeak.topicNameGu || topWeak.topicName;
      weakTopicExplanation = `તમે હાલમાં ${sName} (${tName}) માં મુશ્કેલી અનુભવી રહ્યા છો જ્યાં તમારી ચોકસાઈ માત્ર ${topWeak.accuracy}% છે અને ${topWeak.repeatedMistakes} વારંવાર થતી ભૂલો નોંધાયેલ છે. સમયબદ્ધ પરિસ્થિતિઓમાં યોગ્ય સૂત્રો લાગુ કરવામાં ઉતાવળ કરવી આનું મુખ્ય કારણ છે.`;
    } else {
      weakTopicExplanation = `હાલમાં કોઈ ગંભીર નબળા વિષયો નોંધાયા નથી. તમે તમામ વિષયોમાં સારું સંતુલન જાળવી રહ્યા છો.`;
    }

    const topWeakTopicName = weakData.weakTopics.length > 0 ? (weakData.weakTopics[0].topicNameGu || weakData.weakTopics[0].topicName) : 'અદ્યતન પ્રશ્નોના ઉકેલ';

    studyRecommendations = [
      `દરરોજ 45 મિનિટ ${topWeakTopicName} માટે ફાળવો.`,
      `નવા ટેસ્ટ આપતા પહેલા તમારી ભૂલ પુસ્તકમાં નોંધાયેલા પ્રશ્નોનું પુનરાવર્તન કરો.`,
      `ચોકસાઈ અને ઝડપનું સંતુલન જાળવવા પ્રતિ પ્રશ્ન 45-60 સેકન્ડનો સમય રાખો.`
    ];

    revisionRecommendations = weakData.weakTopics.map(w =>
      `${w.subjectNameGu || w.subjectName} - ${w.topicNameGu || w.topicName} ના મૂળભૂત સૂત્રોનું પુનરાવર્તન કરો અને 5 પાયાના પ્રશ્નો ઉકેલો.`
    );

    recommendedTest = weakData.weakTopics.length > 0
      ? `${weakData.weakTopics[0].subjectNameGu || weakData.weakTopics[0].subjectName} સુધારાત્મક પ્રેક્ટિસ ટેસ્ટ`
      : `અદ્યતન બહુ-વિષય બેંચમાર્ક ટેસ્ટ`;

    learningPriorities = weakData.weakTopics.length > 0
      ? weakData.weakTopics.slice(0, 3).map(w => `[અત્યંત મહત્વપૂર્ણ] ${w.subjectNameGu || w.subjectName}: ${w.topicNameGu || w.topicName}`)
      : [`[મધ્યમ] તમારી દૈનિક અભ્યાસ સ્ટ્રીક (${streak} દિવસ) જાળવી રાખો`, `[ઉચ્ચ] ચેલેન્જ લેવલના ટેસ્ટ આપો`];

    performanceSummary = `પૂર્ણ થયેલા ટેસ્ટ: ${analytics.testsCompleted} | ચોકસાઈ: ${overallAcc}% | સ્ટ્રીક: ${streak} દિવસ | આગામી અનુમાનિત સ્કોર: ${prediction.predictedNextScore}%`;

    motivationMessage = streak >= 3
      ? `🔥 તમે ${streak}-દિવસની અભ્યાસ સ્ટ્રીક પર છો! સાતત્ય એ જ પરીક્ષામાં સફળતાની ચાવી છે!`
      : `💪 દરેક પ્રેક્ટિસ સેશન તમને તમારા લક્ષ્યાંકિત ${user?.profile?.targetPercentage || 85}% સ્કોરની નજીક લાવે છે!`;

    nextStepGuidance = weakData.weakTopics.length > 0
      ? `આજે તમારી અભ્યાસ યોજના ખોલો અને ${topWeakTopicName} માટે 45-મિનિટનું પુનરાવર્તન સેશન પૂર્ણ કરો.`
      : `તમારી સીમાઓને ચકાસવા માટે ભલામણ કરેલ પ્રેક્ટિસ ટેસ્ટ આપો.`;

  } else {
    personalizedFeedback = `Hello ${studentName}! Your overall average score across ${analytics.testsCompleted} tests is ${analytics.averagePercentage}%, with an accuracy rate of ${overallAcc}%. `;
    if (analytics.improvementRate > 0) {
      personalizedFeedback += `Great job! Your performance improved by ${analytics.improvementRate}% compared to your initial tests.`;
    } else if (analytics.improvementRate < 0) {
      personalizedFeedback += `We noticed a ${Math.abs(analytics.improvementRate)}% dip in your recent scores. Targeted revision will help restore your momentum.`;
    } else {
      personalizedFeedback += `Your scores have been stable. With focused effort on weak topics, you can break into higher performance brackets.`;
    }

    if (weakData.weakTopics.length > 0) {
      const topWeak = weakData.weakTopics[0];
      weakTopicExplanation = `You are currently struggling with ${topWeak.subjectName} (${topWeak.topicName}) where your accuracy is ${topWeak.accuracy}% and you have ${topWeak.repeatedMistakes} repeated mistakes. This is often caused by rushing through complex formula application under timed conditions.`;
    } else {
      weakTopicExplanation = `No critical weak topics detected at this moment. You are maintaining solid accuracy across evaluated modules.`;
    }

    studyRecommendations = [
      `Dedicate 45 minutes daily to ${weakData.weakTopics.length > 0 ? weakData.weakTopics[0].topicName : 'advanced problem solving'}.`,
      `Review questions logged in your Mistake Book before attempting new full-length tests.`,
      `Maintain a steady answering speed of ~45-60 seconds per question to balance speed and accuracy.`
    ];

    revisionRecommendations = weakData.weakTopics.map(w =>
      `Revise basic identities & solve 5 foundational problems in ${w.subjectName} - ${w.topicName}.`
    );

    recommendedTest = weakData.weakTopics.length > 0
      ? `${weakData.weakTopics[0].subjectName} Remedial Practice Test`
      : `Advanced Multi-Subject Benchmark Test`;

    learningPriorities = weakData.weakTopics.length > 0
      ? weakData.weakTopics.slice(0, 3).map(w => `[HIGH PRIORITY] ${w.subjectName}: ${w.topicName}`)
      : [`[MEDIUM] Maintain current study streak (${streak} days)`, `[MEDIUM] Attempt challenge level tests`];

    performanceSummary = `Completed ${analytics.testsCompleted} tests | Accuracy: ${overallAcc}% | Streak: ${streak} days | Predicted Next Score: ${prediction.predictedNextScore}%`;

    motivationMessage = streak >= 3
      ? `🔥 You are on a ${streak}-day study streak! Consistency is the single biggest predictor of exam mastery!`
      : `💪 Every practice session brings you closer to your target score of ${user?.profile?.targetPercentage || 85}%!`;

    nextStepGuidance = weakData.weakTopics.length > 0
      ? `Open your Study Plan today and complete the 45-minute revision block for ${weakData.weakTopics[0].topicName}.`
      : `Attempt the recommended practice test to challenge your limits.`;
  }

  return {
    personalizedFeedback,
    weakTopicExplanation,
    studyRecommendations,
    revisionRecommendations,
    recommendedTest,
    learningPriorities,
    performanceSummary,
    motivationMessage,
    nextStepGuidance
  };
}

export async function askAIService(userId: string, question: string, lang: string = 'en'): Promise<string> {
  const isGu = lang === 'gu';
  const analytics = await calculateStudentAnalytics(userId);
  const weakData = await detectWeakTopics(userId);
  const prediction = await predictPerformance(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  const qLower = question.toLowerCase();

  const weakList = isGu
    ? weakData.weakTopics.map(w => `${w.subjectNameGu || w.subjectName} (${w.topicNameGu || w.topicName}: ${w.accuracy}% ચોકસાઈ)`).join(', ')
    : weakData.weakTopics.map(w => `${w.subjectName} (${w.topicName}: ${w.accuracy}% accuracy)`).join(', ');
  const strongList = isGu
    ? weakData.strongTopics.map(s => `${s.subjectNameGu || s.subjectName} (${s.topicNameGu || s.topicName})`).join(', ')
    : weakData.strongTopics.map(s => `${s.subjectName} (${s.topicName})`).join(', ');

  // 1. "what should i study today" / "આજે શું અભ્યાસ કરવો"
  if (
    qLower.includes('what should i study today') ||
    qLower.includes('study today') ||
    qLower.includes('અભ્યાસ') ||
    qLower.includes('આજે')
  ) {
    if (weakData.weakTopics.length > 0) {
      const topW = weakData.weakTopics[0];
      const sName = isGu ? (topW.subjectNameGu || topW.subjectName) : topW.subjectName;
      const tName = isGu ? (topW.topicNameGu || topW.topicName) : topW.topicName;
      return isGu
        ? `તમારા તાજેતરના ડેટાબેઝ એનાલિટિક્સના આધારે, આજે તમારી મુખ્ય પ્રાથમિકતા **${sName} – ${tName}** (ચોકસાઈ: ${topW.accuracy}%) છે. આ વિષયના ખ્યાલોના પુનરાવર્તન માટે 45 મિનિટ ફાળવો અને ભૂલ પુસ્તકમાં બાકી રહેલી ભૂલો સુધારો.`
        : `Based on your recent database analytics, your top priority for today is **${topW.subjectName} – ${topW.topicName}** (Accuracy: ${topW.accuracy}%). Allocate 45 minutes to review concepts in this topic and clear your pending items in the Mistake Book.`;
    }
    const defaultSub = isGu ? 'ગણિત' : 'Mathematics';
    return isGu
      ? `વર્તમાન વિષયોમાં તમારું પ્રદર્શન મજબૂત છે! આજે **${defaultSub}** ના અદ્યતન પ્રશ્નોની 30 મિનિટ પ્રેક્ટિસ કરો.`
      : `Your performance across current subjects is solid! Today, spend 30 minutes practicing **${analytics.subjectPerformance[0]?.subjectName || 'Mathematics'}** questions at Advanced difficulty level.`;
  }

  // 2. "why am i weak" / "નબળા"
  if (
    qLower.includes('why am i weak') ||
    qLower.includes('weak in') ||
    qLower.includes('નબળો') ||
    qLower.includes('મુશ્કેલી')
  ) {
    if (weakData.weakTopics.length > 0) {
      const topW = weakData.weakTopics[0];
      const tName = isGu ? (topW.topicNameGu || topW.topicName) : topW.topicName;
      return isGu
        ? `અમારા એનાલિટિક્સ એન્જિને તમારા ટેસ્ટના પ્રયાસોનું વિશ્લેષણ કર્યું: **${tName}** માં તમે ${topW.totalQuestionsAttempted} પ્રશ્નોના પ્રયાસો કર્યા છે જેમાં તમારી ચોકસાઈ માત્ર ${topW.accuracy}% છે અને ${topW.repeatedMistakes} વારંવાર ભૂલો થઈ છે. પાયાના સૂત્રોના પુનરાવર્તનથી તમારો સ્કોર સુધરશે.`
        : `Our analytics engine analyzed your test attempts: In **${topW.topicName}**, you have attempted ${topW.totalQuestionsAttempted} questions with an accuracy of only ${topW.accuracy}%, and logged ${topW.repeatedMistakes} repeated mistakes. Conceptual revision will boost your score.`;
    }
    return isGu
      ? `તમારી પાસે હાલમાં કોઈ ગંભીર નબળા વિષયો નથી! તમારી સરેરાશ ચોકસાઈ ${analytics.accuracy}% છે.`
      : `You do not have any critical weak topics logged right now! Your overall accuracy is ${analytics.accuracy}%.`;
  }

  // 3. "which test" / "ટેસ્ટ"
  if (
    qLower.includes('test should i attempt') ||
    qLower.includes('which test') ||
    qLower.includes('ટેસ્ટ')
  ) {
    if (analytics.accuracy < 50) {
      return isGu
        ? `તમારી વર્તમાન ચોકસાઈ ${analytics.accuracy}% હોવાથી, અમે મૂળભૂત ખ્યાલો પર આધારિત **બેઝિક પ્રેક્ટિસ ટેસ્ટ** આપવાની ભારપૂર્વક ભલામણ કરીએ છીએ.`
        : `Since your current overall accuracy is ${analytics.accuracy}%, we strongly recommend attempting a **Basic Practice Test** focusing on core subject fundamentals.`;
    }
    const recSubName = isGu ? (weakData.weakTopics[0]?.subjectNameGu || 'વિજ્ઞાન') : (weakData.weakTopics[0]?.subjectName || 'Science');
    return isGu
      ? `તમારી ચોકસાઈ ${analytics.accuracy}% છે. અમે **${recSubName}** માં મધ્યમ કઠિનતા ધરાવતો પ્રેક્ટિસ ટેસ્ટ આપવાની ભલામણ કરીએ છીએ.`
      : `Your overall accuracy is ${analytics.accuracy}%. We recommend attempting the **Medium Difficulty Practice Test** in ${recSubName}.`;
  }

  // Default intelligent response
  return isGu
    ? `નમસ્તે ${user?.name || 'વિદ્યાર્થી'}! તમારા લાઇવ ટેલિમેટ્રી ડેટા (પૂર્ણ થયેલા ટેસ્ટ: ${analytics.testsCompleted}, ચોકસાઈ: ${analytics.accuracy}%, સરેરાશ સ્કોર: ${analytics.averagePercentage}%): તમારા મજબૂત વિષયો ${strongList || 'સામાન્ય વ્યાકરણ'} છે, જ્યારે મુખ્ય ધ્યાન કેન્દ્રિત કરવાનો વિષય ${weakList || 'ત્રિકોણમિતિ'} છે. આગામી અનુમાનિત સ્કોર ${prediction.predictedNextScore}% છે. આજે હું તમને કેવી રીતે મદદ કરી શકું?`
    : `Hello ${user?.name || 'Student'}! Based on your live database telemetry (${analytics.testsCompleted} tests completed, ${analytics.accuracy}% accuracy, ${analytics.averagePercentage}% average percentage): Your current strong areas are ${strongList || 'General Grammar'}, while your primary focus area is ${weakList || 'Trigonometry'}. Predicted next test score is estimated at ${prediction.predictedNextScore}%. How can I assist your study plan today?`;
}
