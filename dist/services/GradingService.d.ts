export interface RashGrade {
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C';
    score: number;
    description: string;
    universityPoints: number;
}
export declare class GradingService {
    /**
     * Calculate Rash model grade based on score out of 100
     * According to the Uzbek national certificate system:
     * 70+ points: A+ grade
     * 65-69.9 points: A grade
     * 60-64.9 points: B+ grade
     * 55-59.9 points: B grade
     * 50-54.9 points: C+ grade
     * 46-49.9 points: C grade
     */
    static calculateRashGrade(score: number): RashGrade;
    /**
     * Convert percentage to 100-point scale
     */
    static convertTo100PointScale(percentage: number): number;
    /**
     * Get grade description in Uzbek
     */
    static getGradeDescription(grade: string): string;
}
//# sourceMappingURL=GradingService.d.ts.map