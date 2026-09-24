import * as XLSX from 'xlsx';

export interface ExportDataOptions {
  analytics: any;
  prediction?: any;
  weakTopics?: any[];
  recentTestResults?: any[];
  studentProfile?: any;
  lang?: string;
}

export function exportStudentAnalyticsExcel({
  analytics,
  prediction,
  weakTopics = [],
  recentTestResults = [],
  studentProfile,
  lang = 'en'
}: ExportDataOptions): void {
  const isGu = lang === 'gu';
  const isHi = lang === 'hi';

  const t = (en: string, gu: string, hi: string) => (isGu ? gu : isHi ? hi : en);

  const workbook = XLSX.utils.book_new();

  // ----------------------------------------------------
  // Sheet 1: Executive Summary & Telemetry
  // ----------------------------------------------------
  const summaryRows: (string | number)[][] = [
    [t('VIRTUAL STUDY ASSISTANT - PERFORMANCE ANALYTICS REPORT', 'વર્ચ્યુઅલ સ્ટડી આસિસ્ટન્ટ - પર્ફોર્મન્સ એનાલિટિક્સ રિપોર્ટ', 'वर्चुअल स्टडी असिस्टेंट - प्रदर्शन विश्लेषण रिपोर्ट')],
    [t('Generated On', 'તૈયાર કર્યા તારીખ', 'तैयार करने की तिथि'), new Date().toLocaleString()],
    [],
    [t('1. STUDENT PROFILE', '૧. વિદ્યાર્થી પરિચય', '१. विद्यार्थी परिचय')],
    [t('Student Name', 'વિદ્યાર્થીનું નામ', 'विद्यार्थी का नाम'), studentProfile?.user?.name || studentProfile?.name || t('Registered Student', 'નોંધાયેલ વિદ્યાર્થી', 'पंजीकृत विद्यार्थी')],
    [t('Standard / Grade', 'ધોરણ', 'कक्षा'), studentProfile?.standard || 'Standard 8'],
    [t('Roll Number', 'રોલ નંબર', 'रोल नंबर'), studentProfile?.rollNumber || 'N/A'],
    [t('Active Study Streak', 'અધ્યયન સાતત્ય (સ્ટ્રીક)', 'सक्रिय अध्ययन निरंतरता'), `${studentProfile?.streakCount || 1} ${t('Days', 'દિવસ', 'दिन')}`],
    [],
    [t('2. CORE PERFORMANCE METRICS', '૨. મુખ્ય પ્રદર્શન મેટ્રિક્સ', '२. मुख्य प्रदर्शन मेट्रिक्स')],
    [t('Overall Score (%)', 'કુલ સરેરાશ સ્કોર (%)', 'कुल औसत स्कोर (%)'), `${analytics.overallScore || 0}%`],
    [t('Average Test Percentage', 'સરેરાશ ટેસ્ટ ટકાવારી', 'औसत परीक्षा प्रतिशत'), `${analytics.averagePercentage || 0}%`],
    [t('Overall Accuracy Rate (%)', 'ચોકસાઈ દર (%)', 'सटीकता दर (%)'), `${analytics.accuracy || 0}%`],
    [t('Total Tests Completed', 'પૂર્ણ કરેલ કુલ ટેસ્ટ', 'पूर्ण की गई कुल परीक्षाएं'), analytics.testsCompleted || 0],
    [t('Total Questions Assessed', 'કુલ મૂલ્યાંકન કરેલ પ્રશ્નો', 'कुल मूल्यांकित प्रश्न'), (analytics.totalCorrect || 0) + (analytics.totalWrong || 0) + (analytics.totalUnanswered || 0)],
    [t('Correct Answers', 'સાચા જવાબો', 'सही उत्तर'), analytics.totalCorrect || 0],
    [t('Wrong Answers', 'ખોટા જવાબો', 'गलत उत्तर'), analytics.totalWrong || 0],
    [t('Unanswered Questions', 'અનુત્તર પ્રશ્નો', 'अनुत्तरित प्रश्न'), analytics.totalUnanswered || 0],
    [t('Correct / Wrong Ratio', 'સાચા/ખોટા પ્રમાણ', 'सही/गलत अनुपात'), `${analytics.correctToWrongRatio || 0} : 1`],
    [t('Performance Improvement Rate', 'સુધારણા દર', 'सुधार दर'), `${analytics.improvementRate >= 0 ? '+' : ''}${analytics.improvementRate || 0}%`],
    [t('Consistency Score', 'સાતત્ય સ્કોર', 'निरंतरता स्कोर'), `${analytics.consistencyScore || 0} / 100`],
    [],
    [t('3. TIME TELEMETRY', '૩. સમય વિશ્લેષણ', '३. समय विश्लेषण')],
    [t('Total Assessment Time (Minutes)', 'કુલ સમય (મિનિટ)', 'कुल समय (मिनट)'), Math.round((analytics.totalTimeTakenSeconds || 0) / 60)],
    [t('Average Time Per Question (Seconds)', 'પ્રશ્ન દીઠ સરેરાશ સમય (સેકન્ડ)', 'प्रति प्रश्न औसत समय (सेकंड)'), analytics.avgTimePerQuestionSeconds || 0],
    [],
    [t('4. PREDICTIVE AI FORECAST', '૪. અનુમાનિત AI પૂર્વાનુમાન', '४. अनुमानी एआई पूर्वानुमान')],
    [t('Predicted Next Test Score', 'આગામી ટેસ્ટનું અપેક્ષિત પરિણામ', 'अगली परीक्षा का अनुमानित स्कोर'), prediction?.predictedNextScore ? `${prediction.predictedNextScore}%` : 'N/A'],
    [
      t('Performance Trend', 'પ્રદર્શન ટ્રેન્ડ', 'प्रदर्शन रुझान'),
      prediction?.trendDirection === 'IMPROVING' || prediction?.trendDirectionGu === 'સુધરી રહ્યું છે' || prediction?.trendDirectionGu === 'સુધરી રહ્યો છે'
        ? t('Improving', 'સુધરી રહ્યો છે', 'सुधर रहा है')
        : prediction?.trendDirection === 'DECLINING' || prediction?.trendDirectionGu === 'ઘટી રહ્યું છે' || prediction?.trendDirectionGu === 'ઘટી રહ્યો છે'
        ? t('Declining', 'ઘટી રહ્યો છે', 'घट रहा है')
        : t('Stable', 'સ્થિર', 'स्थिर')
    ],
    [t('Prediction Confidence Score', 'પૂર્વાનુમાન વિશ્વાસ સ્કોર', 'पूर्वानुमान विश्वास स्कोर'), prediction?.confidenceScore ? `${prediction.confidenceScore}%` : 'N/A'],
    [
      t('AI Recommendation', 'AI ભલામણ', 'एआई अनुशंसा'),
      (isGu ? (prediction?.recommendationSummaryGu || prediction?.recommendationSummary) :
       isHi ? (prediction?.recommendationSummaryGu ? (prediction.recommendationSummaryGu === 'વ્યક્તિગત પ્રદર્શન અનુમાન મેળવવા માટે વધુ ટેસ્ટ આપો.' ? 'व्यक्तिगत प्रदर्शन अनुमान प्राप्त करने के लिए और अधिक टेस्ट दें।' : prediction.recommendationSummary) : prediction?.recommendationSummary) :
       (prediction?.recommendationSummary || prediction?.recommendationSummaryGu)) ||
      t('Continue consistent daily practice.', 'રોજિંદો સતત અભ્યાસ ચાલુ રાખો.', 'नियमित दैनिक अभ्यास जारी रखें।')
    ]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [{ wch: 36 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, summaryWs, t('Executive Summary', 'સારાંશ', 'सारांश'));

  // ----------------------------------------------------
  // Sheet 2: Subject Performance Breakdown
  // ----------------------------------------------------
  const subjectHeaders = [
    t('Subject Name', 'વિષયનું નામ', 'विषय का नाम'),
    t('Subject Code', 'વિષય કોડ', 'विषय कोड'),
    t('Tests Attempted', 'આપેલ ટેસ્ટ', 'दी गई परीक्षाएं'),
    t('Average Score (%)', 'સરેરાશ સ્કોર (%)', 'औसत स्कोर (%)'),
    t('Accuracy (%)', 'ચોકસાઈ (%)', 'सटीकता (%)'),
    t('Status / Mastery', 'સ્થિતિ', 'स्थिति')
  ];

  const subjectRows = (analytics.subjectPerformance || []).map((sp: any) => {
    const subjName = isGu ? (sp.subjectNameGu || sp.subjectName) : sp.subjectName;
    const mastery = sp.averagePercentage >= 75
      ? t('Proficient / Strong', 'ઉત્કૃષ્ટ / મજબૂત', 'उत्कृष्ट / मजबूत')
      : sp.averagePercentage >= 50
      ? t('Average / Satisfactory', 'મધ્યમ / સંતોષકારક', 'मध्यम / संतोषजनक')
      : t('Needs Revision / Weak', 'પુનરાવર્તનની જરૂર / નબળો', 'पुनरावृत्ति की आवश्यकता / कमजोर');

    return [
      subjName,
      sp.code || 'SUBJ',
      sp.testsAttempted || 0,
      `${sp.averagePercentage || 0}%`,
      `${sp.accuracy || 0}%`,
      mastery
    ];
  });

  const subjectWs = XLSX.utils.aoa_to_sheet([subjectHeaders, ...subjectRows]);
  subjectWs['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(workbook, subjectWs, t('Subject Analysis', 'વિષયવાર વિશ્લેષણ', 'विषयवार विश्लेषण'));

  // ----------------------------------------------------
  // Sheet 3: Test Attempt History
  // ----------------------------------------------------
  const testHeaders = [
    t('Date & Time', 'તારીખ અને સમય', 'तिथि और समय'),
    t('Test Title', 'ટેસ્ટનું નામ', 'परीक्षा का शीर्षक'),
    t('Subject', 'વિષય', 'विषय'),
    t('Score Obtained', 'મેળવેલ ગુણ', 'प्राप्त अंक'),
    t('Max Score', 'કુલ ગુણ', 'अधिकतम अंक'),
    t('Percentage (%)', 'ટકાવારી (%)', 'प्रतिशत (%)'),
    t('Accuracy (%)', 'ચોકસાઈ (%)', 'सटीकता (%)'),
    t('Result Tag', 'પરિણામ પરિમાણ', 'परिणाम स्तर')
  ];

  const testRows = (recentTestResults.length > 0 ? recentTestResults : analytics.recentTrends || []).map((tst: any) => {
    const testTitle = isGu ? (tst.testTitleGu || tst.testTitle) : tst.testTitle;
    const subj = isGu ? (tst.subjectNameGu || tst.subjectName || '') : (tst.subjectName || '');
    const dateStr = tst.completedAt ? new Date(tst.completedAt).toLocaleString() : (tst.date || 'N/A');
    const perc = tst.percentage || 0;
    const tag = perc >= 75
      ? t('Excellent', 'ઉત્તમ', 'उत्कृष्ट')
      : perc >= 50
      ? t('Passed', 'પાસ', 'उत्तीर्ण')
      : t('Needs Remedial', 'ઉપચારાત્મક સહાય જરૂર', 'उपचारात्मक सहायता आवश्यक');

    return [
      dateStr,
      testTitle || 'Test Assessment',
      subj || 'General',
      tst.score !== undefined ? tst.score : 'N/A',
      tst.maxScore !== undefined ? tst.maxScore : 'N/A',
      `${perc}%`,
      `${tst.accuracy || perc}%`,
      tag
    ];
  });

  const testWs = XLSX.utils.aoa_to_sheet([testHeaders, ...testRows]);
  testWs['!cols'] = [{ wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(workbook, testWs, t('Test History', 'ટેસ્ટ ઇતિહાસ', 'परीक्षा इतिहास'));

  // ----------------------------------------------------
  // Sheet 4: Weak Topics & Diagnostics
  // ----------------------------------------------------
  const weakHeaders = [
    t('Subject', 'વિષય', 'विषय'),
    t('Weak Topic / Chapter', 'નબળો મુદ્દો / પ્રકરણ', 'कमजोर बिंदु / अध्याय'),
    t('Accuracy Rate (%)', 'ચોકસાઈ (%)', 'सटीकता (%)'),
    t('Repeated Errors', 'વારંવાર ભૂલો', 'बार-बार त्रुटियां'),
    t('Status / Severity', 'તીવ્રતા', 'गंभीरता'),
    t('AI Remedial Guidance', 'AI સુધારણા માર્ગદર્શન', 'एआई सुधार मार्गदर्शन')
  ];

  const weakRows = (weakTopics || []).map((wt: any) => {
    const subjName = isGu ? (wt.subjectNameGu || wt.subjectName) : wt.subjectName;
    const topicName = isGu ? (wt.topicNameGu || wt.topicName) : wt.topicName;
    const rec = isGu ? (wt.recommendationGu || wt.recommendation) : wt.recommendation;

    return [
      subjName || 'General',
      topicName,
      `${wt.accuracy || 0}%`,
      wt.repeatedMistakes || 0,
      wt.status || t('CRITICAL', 'ગંભીર', 'गंभीर'),
      rec || t('Review concepts and retake remedial test.', 'સંકલ્પનાઓ સમજો અને ફરી ટેસ્ટ આપો.', 'संकल्पनाओं की समीक्षा करें और पुनः परीक्षा दें।')
    ];
  });

  const weakWs = XLSX.utils.aoa_to_sheet([weakHeaders, ...weakRows]);
  weakWs['!cols'] = [{ wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, weakWs, t('Weak Topics Plan', 'નબળા મુદ્દા આયોજન', 'कमजोर बिंदु योजना'));

  // ----------------------------------------------------
  // Sheet 5: Difficulty Performance Matrix
  // ----------------------------------------------------
  const diffHeaders = [
    t('Difficulty Level', 'કાઠિન્ય સ્તર', 'कठिनाई स्तर'),
    t('Questions Attempted', 'આપેલ પ્રશ્નો', 'प्रयास किए गए प्रश्न'),
    t('Correct Answers', 'સાચા જવાબો', 'सही उत्तर'),
    t('Accuracy (%)', 'ચોકસાઈ (%)', 'सટીકતા (%)')
  ];

  const diffRows = (analytics.difficultyPerformance || []).map((dp: any) => {
    const level = dp.difficulty === 'ADVANCED'
      ? t('Advanced / Hard', 'અદ્યતન (અઘરું)', 'उन्नत (कठिन)')
      : dp.difficulty === 'INTERMEDIATE'
      ? t('Intermediate / Medium', 'મધ્યમ', 'मध्यम')
      : t('Beginner / Easy', 'પ્રારંભિક (સરળ)', 'प्रारंभिक (सरल)');

    return [
      level,
      dp.totalQuestions || 0,
      dp.correctCount || 0,
      `${dp.accuracy || 0}%`
    ];
  });

  const diffWs = XLSX.utils.aoa_to_sheet([diffHeaders, ...diffRows]);
  diffWs['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, diffWs, t('Difficulty Matrix', 'કાઠિન્ય વિશ્લેષણ', 'कठिनाई मैट्रिक्स'));

  // ----------------------------------------------------
  // Write and trigger download
  // ----------------------------------------------------
  const dateSuffix = new Date().toISOString().split('T')[0];
  const fileName = isGu
    ? `વિદ્યાર્થી_પ્રદર્શન_વિશ્લેષણ_${dateSuffix}.xlsx`
    : isHi
    ? `विद्यार्थी_प्रदर्शन_विश्लेषण_${dateSuffix}.xlsx`
    : `Student_Performance_Analytics_${dateSuffix}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
