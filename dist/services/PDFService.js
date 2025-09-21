"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const jspdf_1 = require("jspdf");
const GradingService_1 = require("./GradingService");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class PDFService {
    /**
     * Generate PDF for test results
     */
    static async generateTestResultPDF(testResult, test, userInfo) {
        const doc = new jspdf_1.jsPDF();
        // Set font
        doc.setFont('helvetica');
        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('O\'ZBEKISTON RESPUBLIKASI', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('UMUMTA\'LIM FANLARINI BILISH DARAJASINI BAHOLASHNING MILLIY TEST TIZIMI', 105, 30, { align: 'center' });
        // Line separator
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);
        // User information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Test natijalari', 20, 50);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const gradeData = GradingService_1.GradingService.calculateRashGrade(testResult.percentage);
        // User details
        doc.text(`Familiya, Ism: ${userInfo.lastName} ${userInfo.firstName}`, 20, 65);
        doc.text(`Telefon raqami: ${userInfo.phoneNumber}`, 20, 75);
        doc.text(`Test nomi: ${test.title}`, 20, 85);
        doc.text(`Test sanasi: ${testResult.completedAt.toLocaleDateString('uz-UZ')}`, 20, 95);
        doc.text(`Jami savollar: ${testResult.totalQuestions} ta`, 20, 105);
        // Results section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Test natijalari:', 20, 125);
        // Grade display
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(testResult.rashGrade || 'N/A', 105, 140, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(gradeData.description, 105, 150, { align: 'center' });
        // Score grid
        const scores = [
            { label: 'To\'g\'ri javoblar', value: `${testResult.correctAnswers}/${testResult.totalQuestions}` },
            { label: 'Foiz', value: `${testResult.percentage}%` },
            { label: 'OTM uchun ball', value: `${testResult.universityPoints || 0}` },
            { label: 'Daraja', value: testResult.rashGrade || 'N/A' }
        ];
        let yPos = 170;
        scores.forEach((score, index) => {
            const x = 20 + (index % 2) * 85;
            const y = yPos + Math.floor(index / 2) * 15;
            doc.setFontSize(9);
            doc.text(score.label, x, y);
            doc.setFont('helvetica', 'bold');
            doc.text(score.value, x, y + 8);
            doc.setFont('helvetica', 'normal');
        });
        // Certificate note
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Sertifikat haqida:', 20, 220);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const description = GradingService_1.GradingService.getGradeDescription(testResult.rashGrade || 'C');
        const splitDescription = doc.splitTextToSize(description, 170);
        doc.text(splitDescription, 20, 230);
        // Footer
        doc.setFontSize(8);
        doc.text('Ushbu hujjat Yagona interaktiv davlat xizmatlari portali (my.gov.uz) orqali yaratilgan', 105, 280, { align: 'center' });
        doc.text(`Yaratilgan sana: ${new Date().toLocaleDateString('uz-UZ')}`, 105, 285, { align: 'center' });
        doc.text('© 2024 O\'zbekiston Respublikasi Vazirlar Mahkamasi', 105, 290, { align: 'center' });
        // Save PDF
        const resultsDir = path_1.default.join(process.cwd(), 'results');
        if (!fs_1.default.existsSync(resultsDir)) {
            fs_1.default.mkdirSync(resultsDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `test-result-${testResult._id}-${timestamp}.pdf`;
        const filepath = path_1.default.join(resultsDir, filename);
        doc.save(filepath);
        return filepath;
    }
    /**
     * Generate PDF for all test results (admin function)
     */
    static async generateAllResultsPDF(testResults, test) {
        const doc = new jspdf_1.jsPDF();
        // Set font
        doc.setFont('helvetica');
        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('O\'ZBEKISTON RESPUBLIKASI', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('UMUMTA\'LIM FANLARINI BILISH DARAJASINI BAHOLASHNING MILLIY TEST TIZIMI', 105, 30, { align: 'center' });
        // Line separator
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);
        // Test information
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Test natijalari hisoboti', 20, 50);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Test nomi: ${test.title}`, 20, 65);
        doc.text(`Jami ishtirokchilar: ${testResults.length} kishi`, 20, 75);
        doc.text(`Hisobot sanasi: ${new Date().toLocaleDateString('uz-UZ')}`, 20, 85);
        // Calculate statistics
        const totalScore = testResults.reduce((sum, result) => sum + result.percentage, 0);
        const averageScore = Math.round(totalScore / testResults.length);
        const gradeCounts = testResults.reduce((counts, result) => {
            const grade = result.rashGrade || 'N/A';
            counts[grade] = (counts[grade] || 0) + 1;
            return counts;
        }, {});
        doc.text(`O'rtacha ball: ${averageScore}%`, 20, 95);
        // Grade distribution
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Daraja bo\'yicha taqsimot:', 20, 110);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let yPos = 120;
        Object.entries(gradeCounts).forEach(([grade, count]) => {
            doc.text(`${grade}: ${count} kishi`, 20, yPos);
            yPos += 10;
        });
        // Results table
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Barcha natijalar:', 20, yPos + 10);
        // Table headers
        const tableY = yPos + 20;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('№', 20, tableY);
        doc.text('Familiya, Ism', 30, tableY);
        doc.text('Telefon', 80, tableY);
        doc.text('To\'g\'ri', 120, tableY);
        doc.text('Foiz', 140, tableY);
        doc.text('Daraja', 160, tableY);
        doc.text('OTM balli', 180, tableY);
        // Table data
        doc.setFont('helvetica', 'normal');
        let currentY = tableY + 10;
        testResults.forEach((result, index) => {
            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
            }
            const user = result.userId;
            doc.text((index + 1).toString(), 20, currentY);
            doc.text(`${user?.lastName || 'N/A'} ${user?.firstName || 'N/A'}`, 30, currentY);
            doc.text(user?.phoneNumber || 'N/A', 80, currentY);
            doc.text(`${result.correctAnswers}/${result.totalQuestions}`, 120, currentY);
            doc.text(`${result.percentage}%`, 140, currentY);
            doc.text(result.rashGrade || 'N/A', 160, currentY);
            doc.text((result.universityPoints || 0).toString(), 180, currentY);
            currentY += 8;
        });
        // Footer
        doc.setFontSize(8);
        doc.text('Ushbu hujjat Yagona interaktiv davlat xizmatlari portali (my.gov.uz) orqali yaratilgan', 105, 280, { align: 'center' });
        doc.text(`Yaratilgan sana: ${new Date().toLocaleDateString('uz-UZ')}`, 105, 285, { align: 'center' });
        doc.text('© 2024 O\'zbekiston Respublikasi Vazirlar Mahkamasi', 105, 290, { align: 'center' });
        // Save PDF
        const resultsDir = path_1.default.join(process.cwd(), 'results');
        if (!fs_1.default.existsSync(resultsDir)) {
            fs_1.default.mkdirSync(resultsDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `all-results-${test._id}-${timestamp}.pdf`;
        const filepath = path_1.default.join(resultsDir, filename);
        doc.save(filepath);
        return filepath;
    }
}
exports.PDFService = PDFService;
//# sourceMappingURL=PDFService.js.map