import { Document } from 'mongoose';
export interface IQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}
export interface ITest extends Document {
    title: string;
    description: string;
    questions: IQuestion[];
    totalQuestions: number;
    timeLimit?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Test.d.ts.map