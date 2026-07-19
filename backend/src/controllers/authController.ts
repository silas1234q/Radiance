import { catchAsync } from '../utils/catchAsync';
import { getAuth } from '@clerk/express';
import AuthError from '../errors/AuthError';
import { authService } from '../services/authService';

export const registerUserOrLogin = catchAsync(async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) throw new AuthError('user not authenticated');

  const user = await authService(userId);

  res.status(200).json(user);
});
