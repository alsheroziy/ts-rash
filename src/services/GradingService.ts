export class GradingService {
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

  static calculateRashScore(correctAnswers: number, totalQuestions: number): number {
    return Math.round((correctAnswers / totalQuestions) * 100 * 100) / 100;
  }

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
