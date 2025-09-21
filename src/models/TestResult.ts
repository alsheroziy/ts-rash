import mongoose, { Schema } from 'mongoose';
import { ITestResult } from '../interfaces/TestResult';

const TestResultSchema = new Schema<ITestResult>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  testId: {
    type: String,
    required: true,
    ref: 'Test'
  },
  answers: {
    type: Map,
    of: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true,
    default: 0
  },
  percentage: {
    type: Number,
    required: true,
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number // in minutes
  }
}, {
  timestamps: true
});

export default mongoose.model<ITestResult>('TestResult', TestResultSchema);
