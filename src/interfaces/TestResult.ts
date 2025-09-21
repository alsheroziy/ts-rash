import { Document } from 'mongoose';

export interface ITestResult extends Document {
  userId: string;
  testId: string;
  answers: Map<string, string>;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  completedAt: Date;
  timeSpent?: number; // in minutes
}
