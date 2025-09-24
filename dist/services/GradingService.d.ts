export declare class GradingService {
    /**
     * Rash modeli baholash tizimi bo'yicha daraja hisoblash
     * @param score - Talabgorning balli (0-75)
     * @returns Daraja (A+, A, B+, B, C+, C)
     */
    static calculateGrade(score: number): string;
    /**
     * Rash modeli bo'yicha ball hisoblash
     * @param correctAnswers - To'g'ri javoblar soni
     * @param totalQuestions - Jami savollar soni
     * @returns Rash modeli bo'yicha ball
     */
    static calculateRashScore(correctAnswers: number, totalQuestions: number): number;
    /**
     * To'liq natija obyektini yaratish
     * @param correctAnswers - To'g'ri javoblar soni
     * @param totalQuestions - Jami savollar soni
     * @returns Natija obyekti
     */
    static calculateFullResult(correctAnswers: number, totalQuestions: number): {
        correctAnswers: number;
        totalQuestions: number;
        percentage: number;
        rashScore: number;
        grade: string;
    };
}
//# sourceMappingURL=GradingService.d.ts.map