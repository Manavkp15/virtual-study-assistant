export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
  mobileNumber?: string | null;
  emailVerified?: boolean;
  profile?: StudentProfile;
}

export interface StudentProfile {
  standard?: string;
  rollNumber?: string | null;
  mobileNumber?: string | null;
  udiseCode?: string | null;
  availableHoursPerDay: number;
  examDate?: string;
  targetPercentage: number;
  streakCount: number;
}

export interface Subject {
  id: string;
  name: string;
  nameGu?: string;
  code: string;
  standard?: string;
  icon: string;
  description?: string;
  descriptionGu?: string;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  nameGu?: string;
  order: number;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  chapterId: string;
  name: string;
  nameGu?: string;
  description?: string;
  descriptionGu?: string;
}

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
  recommendation: string;
  recommendationGu?: string;
  lastEvaluatedAt: string;
}

export interface QuestionOption {
  id: string;
  optionText: string;
  optionTextGu?: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  questionTextGu?: string;
  explanation?: string;
  explanationGu?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  subjectName?: string;
  subjectNameGu?: string;
  chapterName?: string;
  chapterNameGu?: string;
  topicName?: string;
  topicNameGu?: string;
  topicId?: string;
  options: QuestionOption[];
}

export interface TestCatalogItem {
  id: string;
  title: string;
  titleGu?: string;
  description?: string;
  descriptionGu?: string;
  subject: {
    id: string;
    name: string;
    nameGu?: string;
    code: string;
  };
  difficulty: 'BASIC' | 'MEDIUM' | 'ADVANCED' | 'CHALLENGE' | 'REVISION';
  durationMinutes: number;
  passPercentage: number;
  _count?: {
    testQuestions: number;
  };
}

export interface ActiveTest {
  id: string;
  title: string;
  titleGu?: string;
  description?: string;
  descriptionGu?: string;
  subjectName: string;
  subjectNameGu?: string;
  difficulty: string;
  durationMinutes: number;
  passPercentage: number;
  questions: Question[];
}

export interface TestResult {
  attemptId: string;
  testTitle: string;
  testTitleGu?: string;
  subjectName: string;
  subjectNameGu?: string;
  score: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  timeTakenSeconds: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  requiresRemedial?: boolean;
  remedialSupportMessage?: string;
  remedialSupportMessageGu?: string;
  whatToStudyNext: string;
  whatToStudyNextGu?: string;
  detailedAnswers?: Array<{
    questionId: string;
    questionText: string;
    questionTextGu?: string;
    topicName: string;
    topicNameGu?: string;
    selectedOption: string;
    selectedOptionGu?: string;
    correctOption: string;
    correctOptionGu?: string;
    isCorrect: boolean;
    explanation?: string;
    explanationGu?: string;
  }>;
}

export interface RemedialWeakTopic {
  id: string;
  name: string;
  nameGu?: string;
  description?: string;
  descriptionGu?: string;
}

export interface RemedialQuestion {
  id: string;
  index: number;
  questionText: string;
  questionTextGu?: string;
  topicName: string;
  topicNameGu?: string;
  topicId: string;
  difficulty?: string;
  options: Array<{
    id: string;
    optionText: string;
    optionTextGu?: string;
  }>;
}

export interface RemedialResult {
  sessionId: string;
  chapterName: string;
  chapterNameGu?: string;
  subjectName: string;
  subjectNameGu?: string;
  score: number;
  maxScore: number;
  percentage: number;
  initialPercentage: number;
  improvementPercentage: number;
  isImproved: boolean;
  encouragementMessage: string;
  encouragementMessageGu?: string;
  timeTakenSeconds: number;
  correctCount: number;
  wrongCount: number;
  stillWeakTopics: Array<{ id: string; name: string; nameGu?: string }>;
  detailedAnswers: Array<{
    questionId: string;
    questionText: string;
    questionTextGu?: string;
    topicName: string;
    topicNameGu?: string;
    selectedOption: string;
    selectedOptionGu?: string;
    correctOption: string;
    correctOptionGu?: string;
    isCorrect: boolean;
    explanation?: string;
    explanationGu?: string;
  }>;
}

export interface RemedialHistoryItem {
  id: string;
  subjectName: string;
  subjectNameGu?: string;
  chapterName: string;
  chapterNameGu?: string;
  initialPercentage: number;
  remedialPercentage: number;
  improvementPercentage: number;
  score: number;
  maxScore: number;
  completedAt: string;
  encouragementMessage: string;
  encouragementMessageGu?: string;
  weakTopics: RemedialWeakTopic[];
  stillWeakTopics: RemedialWeakTopic[];
}

export interface MistakeEntry {
  id: string;
  questionId: string;
  questionText: string;
  questionTextGu?: string;
  explanation?: string;
  explanationGu?: string;
  difficulty: string;
  subjectName: string;
  subjectNameGu?: string;
  chapterName: string;
  chapterNameGu?: string;
  topicName: string;
  topicNameGu?: string;
  studentAnswer: string;
  studentAnswerGu?: string;
  correctAnswer: string;
  correctAnswerGu?: string;
  incorrectCount: number;
  isRepeatedMistake: boolean;
  isResolved: boolean;
  recommendation: string;
  recommendationGu?: string;
  lastAttemptedAt: string;
}

export type ActivityType =
  | 'CONCEPT_REVIEW'
  | 'MCQ_PRACTICE'
  | 'MISTAKE_REVISION'
  | 'FORMULA_DRILL'
  | 'MOCK_QUIZ';

export interface StudyTask {
  id: string;
  topicId: string;
  subjectName: string;
  subjectNameGu?: string;
  topicName: string;
  topicNameGu?: string;
  durationMinutes: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  activityType?: ActivityType;
  dayNumber?: number;
  isCompleted: boolean;
  taskDate: string;
}

export interface StudyPlan {
  id: string;
  availableMinutes: number;
  examDate?: string;
  targetPercentage: number;
  tasks: StudyTask[];
}

export interface DashboardData {
  summaryCards: {
    overallScore: number;
    averagePercentage: number;
    accuracy: number;
    testsCompleted: number;
    strongTopicsCount: number;
    weakTopicsCount: number;
    improvementPercentage: number;
    studyStreak: number;
  };
  analyticsOverview: any;
  weakTopics: TopicAssessment[];
  strongTopics: TopicAssessment[];
  studyPriority: TopicAssessment[];
  recommendedTests: Array<{
    testId: string;
    testTitle: string;
    testTitleGu?: string;
    subjectName: string;
    subjectNameGu?: string;
    recommendedDifficulty: string;
    reason: string;
    reasonGu?: string;
    matchScore: number;
  }>;
  aiGuidance: {
    personalizedFeedback: string;
    weakTopicExplanation: string;
    studyRecommendations: string[];
    revisionRecommendations: string[];
    recommendedTest: string;
    learningPriorities: string[];
    performanceSummary: string;
    motivationMessage: string;
    nextStepGuidance: string;
  };
  recentTestResults: Array<{
    id: string;
    testTitle: string;
    testTitleGu?: string;
    subjectName: string;
    subjectNameGu?: string;
    score: number;
    maxScore: number;
    percentage: number;
    accuracy: number;
    completedAt: string;
  }>;
  prediction: {
    predictedNextScore: number;
    confidenceScore: number;
    trendDirection: 'IMPROVING' | 'STABLE' | 'DECLINING';
    trendDirectionGu?: string;
    subjectPredictions: Array<{
      subjectName: string;
      subjectNameGu?: string;
      currentAverage: number;
      predictedNextScore: number;
      expectedGrade: string;
      expectedGradeGu?: string;
    }>;
    persistentWeakTopics: string[];
    persistentWeakTopicsGu?: string[];
    recommendationSummary: string;
    recommendationSummaryGu?: string;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  titleGu?: string;
  message: string;
  messageGu?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
