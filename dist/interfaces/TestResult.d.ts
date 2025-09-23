import { Document } from 'mongoose';
export interface ITestResult extends Document {
    userId: string;
    testId: string;
    answers: Map<string, string>;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    percentage: number;
    rashScore: number;
    grade: string;
    completedAt: Date;
    timeSpent?: number;
}
//# sourceMappingURL=TestResult.d.ts.map