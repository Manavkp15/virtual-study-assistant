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
  const isHi = lang === 'hi';
  const analytics = await calculateStudentAnalytics(userId);
  const weakData = await detectWeakTopics(userId);
  const prediction = await predictPerformance(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  const studentName = user?.name || (isGu ? 'વિદ્યાર્થી' : (isHi ? 'विद्यार्थी' : 'Student'));
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

  } else if (isHi) {
    const sNameHindi: Record<string, string> = {
      'Mathematics': 'गणित',
      'Maths': 'गणित',
      'Science': 'विज्ञान',
      'Social Science': 'सामाजिक विज्ञान',
      'English': 'अंग्रेज़ी',
      'Gujarati': 'गुजराती',
      'Hindi': 'हिन्दी',
      'Sanskrit': 'संस्कृत'
    };

    personalizedFeedback = `नमस्ते ${studentName}! ${analytics.testsCompleted} परीक्षाओं में आपका औसत स्कोर ${analytics.averagePercentage}% है और आपकी सटीकता ${overallAcc}% है। `;
    if (analytics.improvementRate > 0) {
      personalizedFeedback += `शानदार काम! आपकी प्रारंभिक परीक्षाओं की तुलना में आपके प्रदर्शन में ${analytics.improvementRate}% का सुधार हुआ है।`;
    } else if (analytics.improvementRate < 0) {
      personalizedFeedback += `हमने आपके हालिया स्कोर में ${Math.abs(analytics.improvementRate)}% की गिरावट देखी है। लक्षित पुनरावलोकन से आपकी गति वापस पाने में मदद मिलेगी।`;
    } else {
      personalizedFeedback += `आपका स्कोर स्थिर रहा है। कमजोर विषयों पर ध्यान केंद्रित करके आप बेहतर स्कोर प्राप्त कर सकते हैं।`;
    }

    if (weakData.weakTopics.length > 0) {
      const topWeak = weakData.weakTopics[0];
      const sName = sNameHindi[topWeak.subjectName] || topWeak.subjectNameGu || topWeak.subjectName;
      const tName = topWeak.topicName;
      weakTopicExplanation = `आप वर्तमान में ${sName} (${tName}) में कठिनाई महसूस कर रहे हैं जहाँ आपकी सटीकता केवल ${topWeak.accuracy}% है और ${topWeak.repeatedMistakes} बार-बार होने वाली गलतियाँ दर्ज हैं। समयबद्ध परिस्थितियों में सूत्रों को लागू करने में जल्दबाजी इसका मुख्य कारण है।`;
    } else {
      weakTopicExplanation = `वर्तमान में कोई गंभीर कमजोर विषय नहीं मिला। आप सभी विषयों में अच्छा संतुलन बनाए हुए हैं।`;
    }

    const topWeakTopicName = weakData.weakTopics.length > 0 ? (sNameHindi[weakData.weakTopics[0].subjectName] || weakData.weakTopics[0].topicName) : 'उन्नत प्रश्नों का समाधान';

    studyRecommendations = [
      `प्रतिदिन 45 मिनट ${topWeakTopicName} के लिए आवंटित करें।`,
      `नई परीक्षा देने से पहले अपनी मिस्टेक बुक में दर्ज प्रश्नों का पुनरावलोकन करें।`,
      `सटीकता और गति का संतुलन बनाए रखने के लिए प्रति प्रश्न 45-60 सेकंड का समय रखें।`
    ];

    revisionRecommendations = weakData.weakTopics.map(w =>
      `${sNameHindi[w.subjectName] || w.subjectName} - ${w.topicName} के मूलभूत सूत्रों का पुनरावलोकन करें और 5 बुनियादी प्रश्नों को हल करें।`
    );

    recommendedTest = weakData.weakTopics.length > 0
      ? `${sNameHindi[weakData.weakTopics[0].subjectName] || weakData.weakTopics[0].subjectName} उपचारात्मक अभ्यास परीक्षा`
      : `उन्नत बहु-विषय बेंचमार्क परीक्षा`;

    learningPriorities = weakData.weakTopics.length > 0
      ? weakData.weakTopics.slice(0, 3).map(w => `[अति आवश्यक] ${sNameHindi[w.subjectName] || w.subjectName}: ${w.topicName}`)
      : [`[मध्यम] अपनी दैनिक अध्ययन निरंतरता (${streak} दिन) बनाए रखें`, `[उच्च] चुनौती स्तर की परीक्षाएं दें`];

    performanceSummary = `पूर्ण की गई परीक्षाएं: ${analytics.testsCompleted} | सटीकता: ${overallAcc}% | निरंतरता: ${streak} दिन | आगामी अनुमानित स्कोर: ${prediction.predictedNextScore}%`;

    motivationMessage = streak >= 3
      ? `🔥 आप ${streak}-दिनों की अध्ययन निरंतरता पर हैं! परीक्षा में सफलता की कुंजी निरंतरता ही है!`
      : `💪 प्रत्येक अभ्यास सत्र आपको आपके लक्षित ${user?.profile?.targetPercentage || 85}% स्कोर के करीब लाता है!`;

    nextStepGuidance = weakData.weakTopics.length > 0
      ? `आज अपनी अध्ययन योजना खोलें और ${topWeakTopicName} के लिए 45-मिनट का पुनरावलोकन सत्र पूरा करें।`
      : `अपनी सीमाओं का परीक्षण करने के लिए अनुशंसित अभ्यास परीक्षा दें।`;

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
  const isHi = lang === 'hi';
  const analytics = await calculateStudentAnalytics(userId);
  const weakData = await detectWeakTopics(userId);
  const prediction = await predictPerformance(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  const sNameHindi: Record<string, string> = {
    'Mathematics': 'गणित',
    'Maths': 'गणित',
    'Science': 'विज्ञान',
    'Social Science': 'सामाजिक विज्ञान',
    'English': 'अंग्रेज़ी',
    'Gujarati': 'गुजराती',
    'Hindi': 'हिन्दी',
    'Sanskrit': 'संस्कृत'
  };

  const qLower = question.toLowerCase();

  const weakList = isGu
    ? weakData.weakTopics.map(w => `${w.subjectNameGu || w.subjectName} (${w.topicNameGu || w.topicName}: ${w.accuracy}% ચોકસાઈ)`).join(', ')
    : (isHi
      ? weakData.weakTopics.map(w => `${sNameHindi[w.subjectName] || w.subjectName} (${w.topicName}: ${w.accuracy}% सटीकता)`).join(', ')
      : weakData.weakTopics.map(w => `${w.subjectName} (${w.topicName}: ${w.accuracy}% accuracy)`).join(', '));

  const strongList = isGu
    ? weakData.strongTopics.map(s => `${s.subjectNameGu || s.subjectName} (${s.topicNameGu || s.topicName})`).join(', ')
    : (isHi
      ? weakData.strongTopics.map(s => `${sNameHindi[s.subjectName] || s.subjectName} (${s.topicName})`).join(', ')
      : weakData.strongTopics.map(s => `${s.subjectName} (${s.topicName})`).join(', '));

  // 1. "what should i study today" / "આજે શું અભ્યાસ કરવો" / "आज क्या पढ़ना चाहिए"
  if (
    qLower.includes('what should i study today') ||
    qLower.includes('study today') ||
    qLower.includes('અભ્યાસ') ||
    qLower.includes('આજે') ||
    qLower.includes('अध्ययन') ||
    qLower.includes('आज')
  ) {
    if (weakData.weakTopics.length > 0) {
      const topW = weakData.weakTopics[0];
      const sName = isGu ? (topW.subjectNameGu || topW.subjectName) : (isHi ? (sNameHindi[topW.subjectName] || topW.subjectName) : topW.subjectName);
      const tName = isGu ? (topW.topicNameGu || topW.topicName) : topW.topicName;
      if (isGu) {
        return `તમારા તાજેતરના ડેટાબેઝ એનાલિટિક્સના આધારે, આજે તમારી મુખ્ય પ્રાથમિકતા **${sName} – ${tName}** (ચોકસાઈ: ${topW.accuracy}%) છે. આ વિષયના ખ્યાલોના પુનરાવર્તન માટે 45 મિનિટ ફાળવો અને ભૂલ પુસ્તકમાં બાકી રહેલી ભૂલો સુધારો.`;
      }
      if (isHi) {
        return `आपके हालिया एनालिटिक्स डेटाबेस के आधार पर, आज आपकी मुख्य प्राथमिकता **${sName} – ${tName}** (सटीकता: ${topW.accuracy}%) है। इस विषय की अवधारणाओं के पुनरावलोकन के लिए 45 मिनट दें और मिस्टेक बुक में लंबित प्रश्नों को हल करें।`;
      }
      return `Based on your recent database analytics, your top priority for today is **${topW.subjectName} – ${topW.topicName}** (Accuracy: ${topW.accuracy}%). Allocate 45 minutes to review concepts in this topic and clear your pending items in the Mistake Book.`;
    }
    const defaultSub = isGu ? 'ગણિત' : (isHi ? 'गणित' : 'Mathematics');
    if (isGu) {
      return `વર્તમાન વિષયોમાં તમારું પ્રદર્શન મજબૂત છે! આજે **${defaultSub}** ના અદ્યતન પ્રશ્નોની 30 મિનિટ પ્રેક્ટિસ કરો.`;
    }
    if (isHi) {
      return `वर्तमान विषयों में आपका प्रदर्शन मजबूत है! आज **${defaultSub}** के उन्नत प्रश्नों का 30 मिनट अभ्यास करें।`;
    }
    return `Your performance across current subjects is solid! Today, spend 30 minutes practicing **${analytics.subjectPerformance[0]?.subjectName || 'Mathematics'}** questions at Advanced difficulty level.`;
  }

  // 2. "why am i weak" / "નબળા" / "कमजोर"
  if (
    qLower.includes('why am i weak') ||
    qLower.includes('weak in') ||
    qLower.includes('નબળો') ||
    qLower.includes('મુશ્કેલી') ||
    qLower.includes('कमजोर') ||
    qLower.includes('कठिनाई')
  ) {
    if (weakData.weakTopics.length > 0) {
      const topW = weakData.weakTopics[0];
      const tName = isGu ? (topW.topicNameGu || topW.topicName) : topW.topicName;
      if (isGu) {
        return `અમારા એનાલિટિક્સ એન્જિને તમારા ટેસ્ટના પ્રયાસોનું વિશ્લેષણ કર્યું: **${tName}** માં તમે ${topW.totalQuestionsAttempted} પ્રશ્નોના પ્રયાસો કર્યા છે જેમાં તમારી ચોકસાઈ માત્ર ${topW.accuracy}% છે અને ${topW.repeatedMistakes} વારંવાર ભૂલો થઈ છે. પાયાના સૂત્રોના પુનરાવર્તનથી તમારો સ્કોર સુધરશે.`;
      }
      if (isHi) {
        return `हमारे एनालिटिक्स इंजन ने आपके परीक्षा प्रयासों का विश्लेषण किया: **${tName}** में आपने ${topW.totalQuestionsAttempted} प्रश्नों के प्रयास किए हैं जिसमें आपकी सटीकता केवल ${topW.accuracy}% है और ${topW.repeatedMistakes} बार-बार गलतियाँ हुई हैं। बुनियादी सूत्रों के पुनरावलोकन से आपका स्कोर सुधरेगा।`;
      }
      return `Our analytics engine analyzed your test attempts: In **${topW.topicName}**, you have attempted ${topW.totalQuestionsAttempted} questions with an accuracy of only ${topW.accuracy}%, and logged ${topW.repeatedMistakes} repeated mistakes. Conceptual revision will boost your score.`;
    }
    if (isGu) {
      return `તમારી પાસે હાલમાં કોઈ ગંભીર નબળા વિષયો નથી! તમારી સરેરાશ ચોકસાઈ ${analytics.accuracy}% છે.`;
    }
    if (isHi) {
      return `आपके पास वर्तमान में कोई गंभीर कमजोर विषय नहीं है! आपकी औसत सटीकता ${analytics.accuracy}% है।`;
    }
    return `You do not have any critical weak topics logged right now! Your overall accuracy is ${analytics.accuracy}%.`;
  }

  // 3. "which test" / "ટેસ્ટ" / "परीक्षा"
  if (
    qLower.includes('test should i attempt') ||
    qLower.includes('which test') ||
    qLower.includes('ટેસ્ટ') ||
    qLower.includes('परीक्षा') ||
    qLower.includes('टेस्ट')
  ) {
    if (analytics.accuracy < 50) {
      if (isGu) {
        return `તમારી વર્તમાન ચોકસાઈ ${analytics.accuracy}% હોવાથી, અમે મૂળભૂત ખ્યાલો પર આધારિત **બેઝિક પ્રેક્ટિસ ટેસ્ટ** આપવાની ભારપૂર્વક ભલામણ કરીએ છીએ.`;
      }
      if (isHi) {
        return `आपकी वर्तमान सटीकता ${analytics.accuracy}% होने के कारण, हम मूल अवधारणाओं पर आधारित **बेसिक अभ्यास परीक्षा** देने की सिफारिश करते हैं।`;
      }
      return `Since your current overall accuracy is ${analytics.accuracy}%, we strongly recommend attempting a **Basic Practice Test** focusing on core subject fundamentals.`;
    }
    const recSubName = isGu
      ? (weakData.weakTopics[0]?.subjectNameGu || 'વિજ્ઞાન')
      : (isHi ? (sNameHindi[weakData.weakTopics[0]?.subjectName || 'Science'] || 'विज्ञान') : (weakData.weakTopics[0]?.subjectName || 'Science'));
    if (isGu) {
      return `તમારી ચોકસાઈ ${analytics.accuracy}% છે. અમે **${recSubName}** માં મધ્યમ કઠિનતા ધરાવતો પ્રેક્ટિસ ટેસ્ટ આપવાની ભલામણ કરીએ છીએ.`;
    }
    if (isHi) {
      return `आपकी सटीकता ${analytics.accuracy}% है। हम **${recSubName}** में मध्यम कठिनाई स्तर की अभ्यास परीक्षा देने की सिफारिश करते हैं।`;
    }
    return `Your overall accuracy is ${analytics.accuracy}%. We recommend attempting the **Medium Difficulty Practice Test** in ${recSubName}.`;
  }

  // Default intelligent response
  const studentDisplayName = user?.name || (isGu ? 'વિદ્યાર્થી' : (isHi ? 'विद्यार्थी' : 'Student'));
  if (isGu) {
    return `નમસ્તે ${studentDisplayName}! તમારા લાઇવ ટેલિમેટ્રી ડેટા (પૂર્ણ થયેલા ટેસ્ટ: ${analytics.testsCompleted}, ચોકસાઈ: ${analytics.accuracy}%, સરેરાશ સ્કોર: ${analytics.averagePercentage}%): તમારા મજબૂત વિષયો ${strongList || 'સામાન્ય વ્યાકરણ'} છે, જ્યારે મુખ્ય ધ્યાન કેન્દ્રિત કરવાનો વિષય ${weakList || 'ત્રિકોણમિતિ'} છે. આગામી અનુમાનિત સ્કોર ${prediction.predictedNextScore}% છે. આજે હું તમને કેવી રીતે મદદ કરી શકું?`;
  }
  if (isHi) {
    return `नमस्ते ${studentDisplayName}! आपका लाइव टेलीमेट्री डेटा (पूर्ण की गई परीक्षाएं: ${analytics.testsCompleted}, सटीकता: ${analytics.accuracy}%, औसत स्कोर: ${analytics.averagePercentage}%): आपके मजबूत विषय ${strongList || 'सामान्य व्याकरण'} हैं, जबकि मुख्य ध्यान देने का विषय ${weakList || 'त्रिकोणमिति'} है। आगामी अनुमानित स्कोर ${prediction.predictedNextScore}% है। आज मैं आपकी अध्ययन योजना में किस प्रकार सहायता कर सकता हूँ?`;
  }
  return `Hello ${user?.name || 'Student'}! Based on your live database telemetry (${analytics.testsCompleted} tests completed, ${analytics.accuracy}% accuracy, ${analytics.averagePercentage}% average percentage): Your current strong areas are ${strongList || 'General Grammar'}, while your primary focus area is ${weakList || 'Trigonometry'}. Predicted next test score is estimated at ${prediction.predictedNextScore}%. How can I assist your study plan today?`;
}
