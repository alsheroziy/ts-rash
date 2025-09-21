import User from '../models/User';
import { IUser } from '../interfaces/User';
import { UserState } from '../enum/UserState';

export class UserService {
  static async findOrCreateUser(telegramId: number): Promise<IUser> {
    let user = await User.findOne({ telegramId });
    
    if (!user) {
      user = new User({
        telegramId,
        isRegistered: false,
        answers: new Map(),
        totalScore: 0,
        completedTests: []
      });
      await user.save();
    }
    
    return user;
  }

  static async updateUser(telegramId: number, updateData: Partial<IUser>): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { telegramId },
      updateData,
      { new: true }
    );
  }

  static async getUser(telegramId: number): Promise<IUser | null> {
    return await User.findOne({ telegramId });
  }

  static async completeTest(telegramId: number, testId: string, score: number): Promise<IUser | null> {
    const user = await User.findOne({ telegramId });
    if (!user) return null;

    user.totalScore += score;
    user.completedTests.push(testId);
    user.currentTest = undefined;
    user.currentQuestion = 0;
    user.answers = new Map();

    return await user.save();
  }

  static async startTest(telegramId: number, testId: string): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { telegramId },
      {
        currentTest: testId,
        currentQuestion: 0,
        answers: new Map()
      },
      { new: true }
    );
  }

  static async saveAnswer(telegramId: number, questionId: string, answer: string): Promise<IUser | null> {
    const user = await User.findOne({ telegramId });
    if (!user) return null;

    user.answers.set(questionId, answer);
    return await user.save();
  }

  static async nextQuestion(telegramId: number): Promise<IUser | null> {
    const user = await User.findOne({ telegramId });
    if (!user) return null;

    user.currentQuestion = (user.currentQuestion || 0) + 1;
    return await user.save();
  }

  static async resetCurrentTest(telegramId: number): Promise<IUser | null> {
    // Unset currentTest to avoid stale references and clear progress
    return await User.findOneAndUpdate(
      { telegramId },
      {
        $unset: { currentTest: "" },
        $set: { currentQuestion: 0, answers: {} }
      },
      { new: true }
    );
  }
}
