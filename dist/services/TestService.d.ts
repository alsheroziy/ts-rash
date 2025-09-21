import { ITest } from '../interfaces/Test';
import { ITestResult } from '../interfaces/TestResult';
export declare class TestService {
    static getAllActiveTests(): Promise<ITest[]>;
    static getActiveTestByTitle(title: string): Promise<ITest | null>;
    static getTestById(testId: string): Promise<ITest | null>;
    static getTestQuestion(testId: string, questionIndex: number): Promise<any>;
    static calculateScore(testId: string, answers: Map<string, string>): Promise<{
        score: number;
        correctAnswers: number;
        totalQuestions: number;
        percentage: number;
    }>;
    static saveTestResult(userId: string, testId: string, answers: Map<string, string>, timeSpent?: number): Promise<ITestResult>;
    static getTestStats(testId: string): Promise<{
        totalAttempts: number;
        averageScore: number;
        averagePercentage: number;
    }>;
}
//# sourceMappingURL=TestService.d.ts.map