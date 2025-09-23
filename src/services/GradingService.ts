export class GradingService {
  /**
   * Rash modeli baholash tizimi bo'yicha daraja hisoblash
   * @param score - Talabgorning balli (0-100)
   * @returns Daraja (A+, A, B+, B, C+, C)
   */
  static calculateGrade(score: number): string {
    if (score >= 70) {
      return 'A+';
    } else if (score >= 65 && score < 70) {
      return 'A';
    } else if (score >= 60 && score < 65) {
      return 'B+';
    } else if (score >= 55 && score < 60) {
      return 'B';
    } else if (score >= 50 && score < 55) {
      return 'C+';
    } else if (score >= 46 && score < 50) {
      return 'C';
    } else {
      return 'F'; // Fail - 46 balldan past
    }
  }

  /**
   * Rash modeli bo'yicha ball hisoblash
   * @param correctAnswers - To'g'ri javoblar soni
   * @param totalQuestions - Jami savollar soni
   * @returns Rash modeli bo'yicha ball
   */
  static calculateRashScore(correctAnswers: number, totalQuestions: number): number {
    // Rash modeli formulasi: (correctAnswers / totalQuestions) * 100
    return Math.round((correctAnswers / totalQuestions) * 100 * 100) / 100; // 2 ta kasr o'ringacha
  }

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
  } {
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const rashScore = this.calculateRashScore(correctAnswers, totalQuestions);
    const grade = this.calculateGrade(rashScore);

    return {
      correctAnswers,
      totalQuestions,
      percentage,
      rashScore,
      grade
    };
  }
}
