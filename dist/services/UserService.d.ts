import { IUser } from '../interfaces/User';
export declare class UserService {
    static findOrCreateUser(telegramId: number): Promise<IUser>;
    static updateUser(telegramId: number, updateData: Partial<IUser>): Promise<IUser | null>;
    static getUser(telegramId: number): Promise<IUser | null>;
    static completeTest(telegramId: number, testId: string, score: number): Promise<IUser | null>;
    static startTest(telegramId: number, testId: string): Promise<IUser | null>;
    static saveAnswer(telegramId: number, questionId: string, answer: string): Promise<IUser | null>;
    static nextQuestion(telegramId: number): Promise<IUser | null>;
    static resetCurrentTest(telegramId: number): Promise<IUser | null>;
}
//# sourceMappingURL=UserService.d.ts.map