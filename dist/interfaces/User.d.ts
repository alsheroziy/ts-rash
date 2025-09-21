import { Document } from 'mongoose';
export interface IUser extends Document {
    telegramId: number;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    isRegistered: boolean;
    currentTest?: string;
    currentQuestion?: number;
    answers: Map<string, string>;
    totalScore: number;
    completedTests: string[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=User.d.ts.map