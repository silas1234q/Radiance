import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import { quizQuestions } from '../data/quizQuestions';

export const submitQuiz = catchAsync(async (req, res) => {
  const { answers } = req.body; // Array of { questionId: number, answer: string }
  const userId = req.user!.id;

  const operations = answers.map((a: { questionId: number; answer: string }) => {
    const question = quizQuestions.find(q => q.id === a.questionId);
    return prisma.skinQuizAnswer.upsert({
      where: { userId_questionId: { userId, questionId: a.questionId } },
      update: { answer: a.answer },
      create: {
        userId,
        questionId: a.questionId,
        questionText: question?.text || `Question ${a.questionId}`,
        answer: a.answer,
      },
    });
  });

  await prisma.$transaction(operations, { timeout: 15000 });
  res.json({ success: true, count: answers.length });
});

export const getQuizAnswers = catchAsync(async (req, res) => {
  const answers = await prisma.skinQuizAnswer.findMany({
    where: { userId: req.user!.id },
    orderBy: { questionId: 'asc' },
  });
  res.json(answers);
});
