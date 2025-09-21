"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradingService = void 0;
class GradingService {
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
    static calculateRashGrade(score) {
        // Ensure score is between 0-100
        const normalizedScore = Math.max(0, Math.min(100, score));
        if (normalizedScore >= 70) {
            return {
                grade: 'A+',
                score: normalizedScore,
                description: 'A+ daraja - Eng yuqori natija',
                universityPoints: 100 // Maximum points for university entrance
            };
        }
        else if (normalizedScore >= 65) {
            return {
                grade: 'A',
                score: normalizedScore,
                description: 'A daraja - Juda yaxshi natija',
                universityPoints: Math.round((normalizedScore / 70) * 100) // Proportional to A+
            };
        }
        else if (normalizedScore >= 60) {
            return {
                grade: 'B+',
                score: normalizedScore,
                description: 'B+ daraja - Yaxshi natija',
                universityPoints: Math.round((normalizedScore / 70) * 100) // Proportional to A+
            };
        }
        else if (normalizedScore >= 55) {
            return {
                grade: 'B',
                score: normalizedScore,
                description: 'B daraja - Qoniqarli natija',
                universityPoints: Math.round((normalizedScore / 70) * 100) // Proportional to A+
            };
        }
        else if (normalizedScore >= 50) {
            return {
                grade: 'C+',
                score: normalizedScore,
                description: 'C+ daraja - O\'rtacha natija',
                universityPoints: Math.round((normalizedScore / 70) * 100) // Proportional to A+
            };
        }
        else if (normalizedScore >= 46) {
            return {
                grade: 'C',
                score: normalizedScore,
                description: 'C daraja - Past natija',
                universityPoints: Math.round((normalizedScore / 70) * 100) // Proportional to A+
            };
        }
        else {
            // Below 46 points - no certificate
            return {
                grade: 'C',
                score: normalizedScore,
                description: 'Sertifikat berilmaydi (46 balldan past)',
                universityPoints: 0
            };
        }
    }
    /**
     * Convert percentage to 100-point scale
     */
    static convertTo100PointScale(percentage) {
        return Math.round(percentage);
    }
    /**
     * Get grade description in Uzbek
     */
    static getGradeDescription(grade) {
        const descriptions = {
            'A+': 'A+ daraja - Eng yuqori natija. OTMlarning bakalavriatiga kirish test sinovlarida ushbu fandan maksimal ball beriladi.',
            'A': 'A daraja - Juda yaxshi natija. OTMlarning bakalavriatiga kirish test sinovlarida ushbu fandan maksimal ballga nisbatan proporsional ball beriladi.',
            'B+': 'B+ daraja - Yaxshi natija. OTMlarning bakalavriatiga kirish test sinovlarida ushbu fandan maksimal ballga nisbatan proporsional ball beriladi.',
            'B': 'B daraja - Qoniqarli natija. OTMlarning bakalavriatiga kirish test sinovlarida ushbu fandan maksimal ballga nisbatan proporsional ball beriladi.',
            'C+': 'C+ daraja - O\'rtacha natija. OTMlarning bakalavriatiga kirish test sinovlarida ushbu fandan maksimal ballga nisbatan proporsional ball beriladi.',
            'C': 'C daraja - Past natija. OTMlarning bakalavriatiga kirish test sinovlarida ushbu fandan maksimal ballga nisbatan proporsional ball beriladi.'
        };
        return descriptions[grade] || 'Noma\'lum daraja';
    }
}
exports.GradingService = GradingService;
//# sourceMappingURL=GradingService.js.map