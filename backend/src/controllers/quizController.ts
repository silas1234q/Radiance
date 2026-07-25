import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import { quizQuestions } from '../data/quizQuestions';

export const submitQuiz = catchAsync(async (req, res) => {
  const { answers } = req.body; // Array of { questionId: number, answer: string }
  const userId = req.user!.id;

  const typedAnswers = answers as { questionId: number; answer: string }[];

  // Replace the user's answers in just two round-trips instead of one upsert
  // per question. The DB is remote (Neon/us-east-1), so collapsing ~28
  // serialized round-trips into a single bulk delete + a single bulk insert is
  // dramatically faster and avoids holding a long interactive transaction open.
  // Not wrapped in a transaction on purpose: the client always sends the full
  // answer set, so a retry simply re-runs both steps; keeping them independent
  // lets each use its own pooled connection and retry safely on transient
  // connection drops.
  await prisma.skinQuizAnswer.deleteMany({ where: { userId } });
  await prisma.skinQuizAnswer.createMany({
    data: typedAnswers.map((a) => {
      const question = quizQuestions.find((q) => q.id === a.questionId);
      return {
        userId,
        questionId: a.questionId,
        questionText: question?.text || `Question ${a.questionId}`,
        answer: a.answer,
      };
    }),
  });

  res.json({ success: true, count: typedAnswers.length });
});

export const getQuizAnswers = catchAsync(async (req, res) => {
  const answers = await prisma.skinQuizAnswer.findMany({
    where: { userId: req.user!.id },
    orderBy: { questionId: 'asc' },
  });
  res.json(answers);
});
