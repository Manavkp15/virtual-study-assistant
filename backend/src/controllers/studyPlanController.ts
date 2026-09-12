import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import { generatePersonalizedStudyPlan } from '../algorithms/studyPlanGenerator';

export const getTodayPlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const taskInclude = {
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
      },
      orderBy: [{ dayNumber: 'asc' as const }, { priority: 'desc' as const }]
    };

    let plan = await prisma.studyPlan.findFirst({
      where: { userId },
      include: {
        tasks: taskInclude
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!plan || plan.tasks.length === 0) {
      await generatePersonalizedStudyPlan(userId, { availableHoursPerDay: 3.0 });
      plan = await prisma.studyPlan.findFirst({
        where: { userId },
        include: {
          tasks: taskInclude
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    const formattedTasks = plan?.tasks.map(t => ({
      id: t.id,
      planId: t.planId,
      topicId: t.topicId,
      subjectName: t.topic?.chapter?.subject?.name || t.subjectName,
      subjectNameGu: t.topic?.chapter?.subject?.nameGu || t.topic?.chapter?.subject?.name || t.subjectName,
      topicName: t.topic?.name || t.topicName,
      topicNameGu: t.topic?.nameGu || t.topic?.name || t.topicName,
      durationMinutes: t.durationMinutes,
      priority: t.priority,
      activityType: t.activityType,
      dayNumber: t.dayNumber,
      isCompleted: t.isCompleted,
      taskDate: t.taskDate
    })) || [];

    res.json({
      plan: plan ? {
        ...plan,
        tasks: formattedTasks
      } : null
    });
  } catch (error: any) {
    console.error('getTodayPlan error:', error);
    res.status(500).json({ error: 'Failed to fetch study plan' });
  }
};

export const generatePlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { availableHoursPerDay, examDate, targetPercentage } = req.body;

    const newPlan = await generatePersonalizedStudyPlan(userId, {
      availableHoursPerDay: availableHoursPerDay ? parseFloat(availableHoursPerDay) : 3.0,
      examDate: examDate ? new Date(examDate) : undefined,
      targetPercentage: targetPercentage ? parseFloat(targetPercentage) : 85.0
    });

    const fullPlan = await prisma.studyPlan.findUnique({
      where: { id: newPlan?.id },
      include: {
        tasks: {
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
          },
          orderBy: [{ dayNumber: 'asc' }, { priority: 'desc' }]
        }
      }
    });

    const formattedTasks = fullPlan?.tasks.map(t => ({
      id: t.id,
      planId: t.planId,
      topicId: t.topicId,
      subjectName: t.topic?.chapter?.subject?.name || t.subjectName,
      subjectNameGu: t.topic?.chapter?.subject?.nameGu || t.topic?.chapter?.subject?.name || t.subjectName,
      topicName: t.topic?.name || t.topicName,
      topicNameGu: t.topic?.nameGu || t.topic?.name || t.topicName,
      durationMinutes: t.durationMinutes,
      priority: t.priority,
      activityType: t.activityType,
      dayNumber: t.dayNumber,
      isCompleted: t.isCompleted,
      taskDate: t.taskDate
    })) || [];

    res.json({
      message: 'Personalized study plan generated successfully',
      plan: fullPlan ? {
        ...fullPlan,
        tasks: formattedTasks
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
};

export const toggleTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    const task = await prisma.studyTask.findUnique({
      where: { id },
      include: { plan: true }
    });

    if (!task || task.plan.userId !== userId) {
      return res.status(404).json({ error: 'Study task not found' });
    }

    const updatedTask = await prisma.studyTask.update({
      where: { id },
      data: { isCompleted: !task.isCompleted }
    });

    res.json({ message: 'Task status updated', task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
};
