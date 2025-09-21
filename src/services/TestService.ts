import Test from '../models/Test';
import TestResult from '../models/TestResult';
import { ITest } from '../interfaces/Test';
import { ITestResult } from '../interfaces/TestResult';
import { UserService } from './UserService';

export class TestService {
  static async getAllActiveTests(): Promise<ITest[]> {
    const tests = await Test.find({ isActive: true }).select('title description totalQuestions');
    console.log('🔍 TestService.getAllActiveTests result:', tests.length, 'tests found');
    console.log('Tests:', tests.map(t => ({ title: t.title, isActive: t.isActive })));
    return tests;
  }

  static async getActiveTestByTitle(title: string): Promise<ITest | null> {
    // Normalize title and search case-insensitively, ignoring extra spaces
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const normalized = title.trim().replace(/\s+/g, ' ');
    const regex = new RegExp(`^${escapeRegExp(normalized)}$`, 'i');
    return await Test.findOne({ isActive: true, title: { $regex: regex } });
  }

  static async getTestById(testId: string): Promise<ITest | null> {
    return await Test.findById(testId);
  }

  static async getTestQuestion(testId: string, questionIndex: number): Promise<any> {
    const test = await Test.findById(testId);
    if (!test || questionIndex >= test.questions.length) {
      return null;
    }

    return {
      question: test.questions[questionIndex],
      totalQuestions: test.totalQuestions,
      currentQuestion: questionIndex + 1
    };
  }

  static async calculateScore(testId: string, answers: Map<string, string>): Promise<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    percentage: number;
  }> {
    const test = await Test.findById(testId);
    if (!test) {
      throw new Error('Test not found');
    }

    let correctAnswers = 0;
    const totalQuestions = test.questions.length;

    test.questions.forEach(question => {
      const userAnswer = answers.get(question.id);
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = correctAnswers;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      score,
      correctAnswers,
      totalQuestions,
      percentage
    };
  }

  static async saveTestResult(
    userId: string,
    testId: string,
    answers: Map<string, string>,
    timeSpent?: number
  ): Promise<ITestResult> {
    const scoreData = await this.calculateScore(testId, answers);
    
    const testResult = new TestResult({
      userId,
      testId,
      answers,
      score: scoreData.score,
      totalQuestions: scoreData.totalQuestions,
      correctAnswers: scoreData.correctAnswers,
      percentage: scoreData.percentage,
      timeSpent
    });

    return await testResult.save();
  }

  static async getUserResults(userId: string): Promise<ITestResult[]> {
    return await TestResult.find({ userId })
      .populate('testId', 'title')
      .sort({ completedAt: -1 });
  }

  static async getTestStats(testId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    averagePercentage: number;
  }> {
    const results = await TestResult.find({ testId });
    
    if (results.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        averagePercentage: 0
      };
    }

    const totalAttempts = results.length;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const totalPercentage = results.reduce((sum, result) => sum + result.percentage, 0);

    return {
      totalAttempts,
      averageScore: Math.round(totalScore / totalAttempts),
      averagePercentage: Math.round(totalPercentage / totalAttempts)
    };
  }
}
