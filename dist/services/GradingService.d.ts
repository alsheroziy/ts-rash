export declare class GradingService {
    static calculateGrade(score: number): string;
    static calculateRashScore(correctAnswers: number, totalQuestions: number): number;
    static calculateFullResult(correctAnswers: number, totalQuestions: number): {
        correctAnswers: number;
        totalQuestions: number;
        percentage: number;
        rashScore: number;
        grade: string;
    };
}
//# sourceMappingURL=GradingService.d.ts.map