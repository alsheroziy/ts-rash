import { Document } from 'mongoose';

export interface ITestResult extends Document {
  userId: string;
  testId: string;
  answers: Map<string, string>;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  rashScore: number; // Rash modeli bo'yicha ball
  grade: string; // Daraja (A+, A, B+, B, C+, C)
  completedAt: Date;
  timeSpent?: number; // in minutes
}
