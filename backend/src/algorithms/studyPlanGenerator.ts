import { prisma } from '../database/prisma';

export interface GenerateStudyPlanInput {
  availableHoursPerDay: number;
  examDate?: Date;
  targetPercentage?: number;
}

export type ActivityType =
  | 'CONCEPT_REVIEW'
  | 'MCQ_PRACTICE'
  | 'MISTAKE_REVISION'
  | 'FORMULA_DRILL'
  | 'MOCK_QUIZ';

const ACTIVITY_POOL: ActivityType[] = [
  'CONCEPT_REVIEW',
  'MCQ_PRACTICE',
  'MISTAKE_REVISION',
  'FORMULA_DRILL',
  'MOCK_QUIZ'
];

export async function generatePersonalizedStudyPlan(userId: string, input: GenerateStudyPlanInput) {
  const availableMinutes = Math.round(input.availableHoursPerDay * 60);

  // 1. Get student profile & standard
  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    update: {
      availableHoursPerDay: input.availableHoursPerDay,
      examDate: input.examDate || undefined,
      targetPercentage: input.targetPercentage || 85.0
    },
    create: {
      userId,
      availableHoursPerDay: input.availableHoursPerDay,
      examDate: input.examDate,
      targetPercentage: input.targetPercentage || 85.0
    }
  });

  const studentStandard = profile.standard || 'Standard 8';

  // 2. Fetch student topic performances
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

  // 3. Fetch all topics filtered for student's standard
  const allTopics = await prisma.topic.findMany({
    where: {
      chapter: {
        subject: {
          standard: studentStandard
        }
      }
    },
    include: {
      chapter: {
        include: {
          subject: true
        }
      }
    }
  });

  // If no topics found for current standard, fallback to all topics
  const targetTopics = allTopics.length > 0 ? allTopics : await prisma.topic.findMany({
    include: {
      chapter: {
        include: {
          subject: true
        }
      }
    }
  });

  // 4. Calculate Priority Score for Every Topic
  // Formula: Priority Score = (100 - accuracy) * 0.5 + min(mistakes * 10, 30) + statusWeight
  const topicPriorityList = targetTopics.map((topic) => {
    const perf = performances.find(p => p.topicId === topic.id);
    const accuracy = perf ? perf.accuracy : 0;
    const repeatedMistakes = perf ? perf.repeatedMistakes : 0;
    const status = perf ? perf.status : 'UNSTUDIED';

    let statusWeight = 25; // Default UNSTUDIED
    if (status === 'CRITICAL') statusWeight = 45;
    else if (status === 'NEEDS_IMPROVEMENT') statusWeight = 35;
    else if (status === 'AVERAGE') statusWeight = 15;
    else if (status === 'STRONG') statusWeight = 5;
    else if (status === 'EXCELLENT') statusWeight = 0;

    const baseScore = (100 - accuracy) * 0.5;
    const mistakePenalty = Math.min(repeatedMistakes * 10, 30);
    const priorityScore = Math.round((baseScore + mistakePenalty + statusWeight) * 10) / 10;

    let priorityTier: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (priorityScore >= 65) priorityTier = 'HIGH';
    else if (priorityScore >= 35) priorityTier = 'MEDIUM';
    else priorityTier = 'LOW';

    return {
      topic,
      accuracy,
      status,
      repeatedMistakes,
      priorityScore,
      priorityTier
    };
  });

  // Sort topics descending by priority score
  topicPriorityList.sort((a, b) => b.priorityScore - a.priorityScore);

  // 5. Create new StudyPlan container in DB
  const plan = await prisma.studyPlan.create({
    data: {
      userId,
      availableMinutes,
      examDate: input.examDate,
      targetPercentage: input.targetPercentage || 85.0
    }
  });

  // 6. Generate 7-Day Weekly Schedule with Varied Activities
  const tasksToCreate: Array<{
    planId: string;
    topicId: string;
    subjectName: string;
    topicName: string;
    durationMinutes: number;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    activityType: ActivityType;
    dayNumber: number;
    isCompleted: boolean;
    taskDate: Date;
  }> = [];

  let activityIndex = 0;

  // Generate schedule for 7 Days (Day 1 to Day 7)
  for (let day = 1; day <= 7; day++) {
    let dayRemainingMinutes = availableMinutes;
    const today = new Date();
    today.setDate(today.getDate() + (day - 1));

    // Shift topic focus offset per day to ensure coverage across all topics
    const dayOffset = (day - 1) % Math.max(topicPriorityList.length, 1);
    const dayTopics = [
      ...topicPriorityList.slice(dayOffset),
      ...topicPriorityList.slice(0, dayOffset)
    ];

    for (const item of dayTopics) {
      if (dayRemainingMinutes <= 15) break;

      // Determine task duration based on priority tier and available time
      let taskDuration = 45;
      if (item.priorityTier === 'HIGH') taskDuration = 45;
      else if (item.priorityTier === 'MEDIUM') taskDuration = 35;
      else taskDuration = 25;

      taskDuration = Math.min(taskDuration, dayRemainingMinutes);

      // Select varied activity type (Rotate through pool so consecutive tasks differ)
      const activityType = ACTIVITY_POOL[activityIndex % ACTIVITY_POOL.length];
      activityIndex += 1;

      tasksToCreate.push({
        planId: plan.id,
        topicId: item.topic.id,
        subjectName: item.topic.chapter.subject.name,
        topicName: item.topic.name,
        durationMinutes: taskDuration,
        priority: item.priorityTier,
        activityType,
        dayNumber: day,
        isCompleted: false,
        taskDate: today
      });

      dayRemainingMinutes -= taskDuration;
    }
  }

  // Save tasks to DB
  if (tasksToCreate.length > 0) {
    await prisma.studyTask.createMany({
      data: tasksToCreate
    });
  }

  return await prisma.studyPlan.findUnique({
    where: { id: plan.id },
    include: { tasks: true }
  });
}
