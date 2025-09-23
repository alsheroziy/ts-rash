"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const jspdf_1 = __importDefault(require("jspdf"));
const TestResult_1 = __importDefault(require("../models/TestResult"));
const Test_1 = __importDefault(require("../models/Test"));
const User_1 = __importDefault(require("../models/User"));
class PDFService {
    static async generateResultsPDFWithNames(testId) {
        const doc = new jspdf_1.default();
        // Set font
        doc.setFont('helvetica');
        // Title
        doc.setFontSize(16);
        doc.text('Test Natijalari (Ismlar bilan)', 20, 30);
        // Date
        doc.setFontSize(10);
        const currentDate = new Date().toLocaleDateString('uz-UZ');
        doc.text(`Sana: ${currentDate}`, 20, 40);
        let yPosition = 60;
        if (testId) {
            // Generate PDF for specific test
            const test = await Test_1.default.findById(testId);
            const results = await TestResult_1.default.find({ testId })
                .sort({ completedAt: -1 });
            if (!test) {
                throw new Error('Test topilmadi');
            }
            doc.setFontSize(14);
            doc.text(`Test: ${test.title}`, 20, yPosition);
            yPosition += 20;
            if (results.length === 0) {
                doc.setFontSize(12);
                doc.text('Bu test uchun natijalar yo\'q', 20, yPosition);
                return Buffer.from(doc.output('arraybuffer'));
            }
            // Results table header
            doc.setFontSize(10);
            doc.text('№', 20, yPosition);
            doc.text('Ism', 30, yPosition);
            doc.text('Ball', 80, yPosition);
            doc.text('Foiz', 110, yPosition);
            doc.text('Vaqt', 140, yPosition);
            doc.text('Sana', 170, yPosition);
            // Draw line under header
            doc.line(20, yPosition + 2, 190, yPosition + 2);
            yPosition += 10;
            // Results data
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                // Get user information
                let user = null;
                const userIdNum = Number(result.userId);
                if (!isNaN(userIdNum)) {
                    user = await User_1.default.findOne({ telegramId: userIdNum });
                }
                else {
                    // Fallback: try to find by _id if userId is an ObjectId
                    user = await User_1.default.findById(result.userId);
                }
                const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Noma\'lum';
                doc.text(`${i + 1}`, 20, yPosition);
                doc.text(userName.substring(0, 20), 30, yPosition); // Limit name length
                doc.text(`${result.correctAnswers}/${result.totalQuestions}`, 80, yPosition);
                doc.text(`${result.percentage}%`, 110, yPosition);
                doc.text(`${result.timeSpent || 0} min`, 140, yPosition);
                const date = new Date(result.completedAt).toLocaleDateString('uz-UZ');
                doc.text(date, 170, yPosition);
                yPosition += 8;
            }
            // Statistics
            yPosition += 10;
            doc.setFontSize(12);
            doc.text('Statistika:', 20, yPosition);
            yPosition += 10;
            const totalAttempts = results.length;
            const avgScore = results.reduce((sum, r) => sum + r.correctAnswers, 0) / totalAttempts;
            const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts;
            const bestScore = Math.max(...results.map(r => r.correctAnswers));
            const worstScore = Math.min(...results.map(r => r.correctAnswers));
            doc.setFontSize(10);
            doc.text(`Jami urinishlar: ${totalAttempts}`, 20, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha ball: ${Math.round(avgScore)}/${test.totalQuestions}`, 20, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha foiz: ${Math.round(avgPercentage)}%`, 20, yPosition);
            yPosition += 8;
            doc.text(`Eng yaxshi natija: ${bestScore}/${test.totalQuestions}`, 20, yPosition);
            yPosition += 8;
            doc.text(`Eng yomon natija: ${worstScore}/${test.totalQuestions}`, 20, yPosition);
        }
        else {
            // Generate PDF for all results
            const results = await TestResult_1.default.find({})
                .populate('testId', 'title')
                .sort({ completedAt: -1 })
                .limit(100); // Limit to 100 results for PDF
            if (results.length === 0) {
                doc.setFontSize(12);
                doc.text('Hozircha natijalar yo\'q', 20, yPosition);
                return Buffer.from(doc.output('arraybuffer'));
            }
            doc.setFontSize(14);
            doc.text('Barcha test natijalari (Ismlar bilan)', 20, yPosition);
            yPosition += 20;
            // Results table header
            doc.setFontSize(10);
            doc.text('№', 20, yPosition);
            doc.text('Ism', 30, yPosition);
            doc.text('Test', 80, yPosition);
            doc.text('Ball', 140, yPosition);
            doc.text('Foiz', 170, yPosition);
            doc.text('Sana', 190, yPosition);
            // Draw line under header
            doc.line(20, yPosition + 2, 200, yPosition + 2);
            yPosition += 10;
            // Results data
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                // Get user information
                let user = null;
                const userIdNum = Number(result.userId);
                if (!isNaN(userIdNum)) {
                    user = await User_1.default.findOne({ telegramId: userIdNum });
                }
                else {
                    // Fallback: try to find by _id if userId is an ObjectId
                    user = await User_1.default.findById(result.userId);
                }
                const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Noma\'lum';
                const testTitle = result.testId?.title || 'Noma\'lum test';
                const truncatedTitle = testTitle.length > 15 ? testTitle.substring(0, 15) + '...' : testTitle;
                doc.text(`${i + 1}`, 20, yPosition);
                doc.text(userName.substring(0, 15), 30, yPosition); // Limit name length
                doc.text(truncatedTitle, 80, yPosition);
                doc.text(`${result.correctAnswers}/${result.totalQuestions}`, 140, yPosition);
                doc.text(`${result.percentage}%`, 170, yPosition);
                const date = new Date(result.completedAt).toLocaleDateString('uz-UZ');
                doc.text(date, 190, yPosition);
                yPosition += 8;
            }
            // Overall statistics
            yPosition += 10;
            doc.setFontSize(12);
            doc.text('Umumiy statistika:', 20, yPosition);
            yPosition += 10;
            const totalResults = await TestResult_1.default.countDocuments();
            const avgPercentage = await TestResult_1.default.aggregate([
                { $group: { _id: null, avgPercentage: { $avg: '$percentage' } } }
            ]);
            doc.setFontSize(10);
            doc.text(`Jami natijalar: ${totalResults}`, 20, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha foiz: ${avgPercentage[0]?.avgPercentage ? Math.round(avgPercentage[0].avgPercentage) : 0}%`, 20, yPosition);
        }
        return Buffer.from(doc.output('arraybuffer'));
    }
    static async generateResultsPDF(testId) {
        const doc = new jspdf_1.default();
        // Set font
        doc.setFont('helvetica');
        // Title
        doc.setFontSize(16);
        doc.text('Test Natijalari', 20, 30);
        // Date
        doc.setFontSize(10);
        const currentDate = new Date().toLocaleDateString('uz-UZ');
        doc.text(`Sana: ${currentDate}`, 20, 40);
        let yPosition = 60;
        if (testId) {
            // Generate PDF for specific test
            const test = await Test_1.default.findById(testId);
            const results = await TestResult_1.default.find({ testId })
                .sort({ completedAt: -1 });
            if (!test) {
                throw new Error('Test topilmadi');
            }
            doc.setFontSize(14);
            doc.text(`Test: ${test.title}`, 20, yPosition);
            yPosition += 20;
            if (results.length === 0) {
                doc.setFontSize(12);
                doc.text('Bu test uchun natijalar yo\'q', 20, yPosition);
                return Buffer.from(doc.output('arraybuffer'));
            }
            // Results table header
            doc.setFontSize(10);
            doc.text('№', 20, yPosition);
            doc.text('Ball', 40, yPosition);
            doc.text('Foiz', 70, yPosition);
            doc.text('Vaqt', 100, yPosition);
            doc.text('Sana', 140, yPosition);
            // Draw line under header
            doc.line(20, yPosition + 2, 180, yPosition + 2);
            yPosition += 10;
            // Results data
            results.forEach((result, index) => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(`${index + 1}`, 20, yPosition);
                doc.text(`${result.correctAnswers}/${result.totalQuestions}`, 40, yPosition);
                doc.text(`${result.percentage}%`, 70, yPosition);
                doc.text(`${result.timeSpent || 0} min`, 100, yPosition);
                const date = new Date(result.completedAt).toLocaleDateString('uz-UZ');
                doc.text(date, 140, yPosition);
                yPosition += 8;
            });
            // Statistics
            yPosition += 10;
            doc.setFontSize(12);
            doc.text('Statistika:', 20, yPosition);
            yPosition += 10;
            const totalAttempts = results.length;
            const avgScore = results.reduce((sum, r) => sum + r.correctAnswers, 0) / totalAttempts;
            const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts;
            const bestScore = Math.max(...results.map(r => r.correctAnswers));
            const worstScore = Math.min(...results.map(r => r.correctAnswers));
            doc.setFontSize(10);
            doc.text(`Jami urinishlar: ${totalAttempts}`, 20, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha ball: ${Math.round(avgScore)}/${test.totalQuestions}`, 20, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha foiz: ${Math.round(avgPercentage)}%`, 20, yPosition);
            yPosition += 8;
            doc.text(`Eng yaxshi natija: ${bestScore}/${test.totalQuestions}`, 20, yPosition);
            yPosition += 8;
            doc.text(`Eng yomon natija: ${worstScore}/${test.totalQuestions}`, 20, yPosition);
        }
        else {
            // Generate PDF for all results
            const results = await TestResult_1.default.find({})
                .populate('testId', 'title')
                .sort({ completedAt: -1 })
                .limit(100); // Limit to 100 results for PDF
            if (results.length === 0) {
                doc.setFontSize(12);
                doc.text('Hozircha natijalar yo\'q', 20, yPosition);
                return Buffer.from(doc.output('arraybuffer'));
            }
            doc.setFontSize(14);
            doc.text('Barcha test natijalari', 20, yPosition);
            yPosition += 20;
            // Results table header
            doc.setFontSize(10);
            doc.text('№', 20, yPosition);
            doc.text('Test', 40, yPosition);
            doc.text('Ball', 100, yPosition);
            doc.text('Foiz', 130, yPosition);
            doc.text('Sana', 160, yPosition);
            // Draw line under header
            doc.line(20, yPosition + 2, 180, yPosition + 2);
            yPosition += 10;
            // Results data
            results.forEach((result, index) => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(`${index + 1}`, 20, yPosition);
                const testTitle = result.testId?.title || 'Noma\'lum test';
                const truncatedTitle = testTitle.length > 25 ? testTitle.substring(0, 25) + '...' : testTitle;
                doc.text(truncatedTitle, 40, yPosition);
                doc.text(`${result.correctAnswers}/${result.totalQuestions}`, 100, yPosition);
                doc.text(`${result.percentage}%`, 130, yPosition);
                const date = new Date(result.completedAt).toLocaleDateString('uz-UZ');
                doc.text(date, 160, yPosition);
                yPosition += 8;
            });
            // Overall statistics
            yPosition += 10;
            doc.setFontSize(12);
            doc.text('Umumiy statistika:', 20, yPosition);
            yPosition += 10;
            const totalResults = await TestResult_1.default.countDocuments();
            const avgPercentage = await TestResult_1.default.aggregate([
                { $group: { _id: null, avgPercentage: { $avg: '$percentage' } } }
            ]);
            doc.setFontSize(10);
            doc.text(`Jami natijalar: ${totalResults}`, 20, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha foiz: ${avgPercentage[0]?.avgPercentage ? Math.round(avgPercentage[0].avgPercentage) : 0}%`, 20, yPosition);
        }
        return Buffer.from(doc.output('arraybuffer'));
    }
    static async generateAnonymousResultsPDF(testId) {
        // Generate PDF without user identification (anonymous results)
        const doc = new jspdf_1.default();
        // Set font
        doc.setFont('helvetica');
        // Title
        doc.setFontSize(16);
        doc.text('Essesiz Natijalar', 20, 30);
        // Date
        doc.setFontSize(10);
        const currentDate = new Date().toLocaleDateString('uz-UZ');
        doc.text(`Sana: ${currentDate}`, 20, 40);
        let yPosition = 60;
        if (testId) {
            // Generate anonymous PDF for specific test
            const test = await Test_1.default.findById(testId);
            const results = await TestResult_1.default.find({ testId })
                .sort({ percentage: -1 }); // Sort by percentage descending
            if (!test) {
                throw new Error('Test topilmadi');
            }
            doc.setFontSize(14);
            doc.text(`Test: ${test.title}`, 20, yPosition);
            yPosition += 20;
            if (results.length === 0) {
                doc.setFontSize(12);
                doc.text('Bu test uchun natijalar yo\'q', 20, yPosition);
                return Buffer.from(doc.output('arraybuffer'));
            }
            // Results table header
            doc.setFontSize(10);
            doc.text('O\'rin', 20, yPosition);
            doc.text('Ball', 50, yPosition);
            doc.text('Foiz', 80, yPosition);
            doc.text('Vaqt', 110, yPosition);
            // Draw line under header
            doc.line(20, yPosition + 2, 150, yPosition + 2);
            yPosition += 10;
            // Results data (anonymous)
            results.forEach((result, index) => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(`${index + 1}`, 20, yPosition);
                doc.text(`${result.correctAnswers}/${result.totalQuestions}`, 50, yPosition);
                doc.text(`${result.percentage}%`, 80, yPosition);
                doc.text(`${result.timeSpent || 0} min`, 110, yPosition);
                yPosition += 8;
            });
            // Statistics
            yPosition += 10;
            doc.setFontSize(12);
            doc.text('Statistika:', 20, yPosition);
            yPosition += 10;
            const totalAttempts = results.length;
            const avgScore = results.reduce((sum, r) => sum + r.correctAnswers, 0) / totalAttempts;
            const avgPercentage = results.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts;
            const bestScore = Math.max(...results.map(r => r.correctAnswers));
            const worstScore = Math.min(...results.map(r => r.correctAnswers));
            doc.setFontSize(10);
            doc.text(`Jami urinishlar: ${totalAttempts}`, 20, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha ball: ${Math.round(avgScore)}/${test.totalQuestions}`, 20, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha foiz: ${Math.round(avgPercentage)}%`, 20, yPosition);
            yPosition += 8;
            doc.text(`Eng yaxshi natija: ${bestScore}/${test.totalQuestions}`, 20, yPosition);
            yPosition += 8;
            doc.text(`Eng yomon natija: ${worstScore}/${test.totalQuestions}`, 20, yPosition);
        }
        else {
            // Generate anonymous PDF for all results
            const results = await TestResult_1.default.find({})
                .populate('testId', 'title')
                .sort({ percentage: -1 })
                .limit(100);
            if (results.length === 0) {
                doc.setFontSize(12);
                doc.text('Hozircha natijalar yo\'q', 20, yPosition);
                return Buffer.from(doc.output('arraybuffer'));
            }
            doc.setFontSize(14);
            doc.text('Barcha test natijalari (Essesiz)', 20, yPosition);
            yPosition += 20;
            // Results table header
            doc.setFontSize(10);
            doc.text('O\'rin', 20, yPosition);
            doc.text('Test', 50, yPosition);
            doc.text('Ball', 120, yPosition);
            doc.text('Foiz', 150, yPosition);
            // Draw line under header
            doc.line(20, yPosition + 2, 170, yPosition + 2);
            yPosition += 10;
            // Results data (anonymous)
            results.forEach((result, index) => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(`${index + 1}`, 20, yPosition);
                const testTitle = result.testId?.title || 'Noma\'lum test';
                const truncatedTitle = testTitle.length > 20 ? testTitle.substring(0, 20) + '...' : testTitle;
                doc.text(truncatedTitle, 50, yPosition);
                doc.text(`${result.correctAnswers}/${result.totalQuestions}`, 120, yPosition);
                doc.text(`${result.percentage}%`, 150, yPosition);
                yPosition += 8;
            });
            // Overall statistics
            yPosition += 10;
            doc.setFontSize(12);
            doc.text('Umumiy statistika:', 20, yPosition);
            yPosition += 10;
            const totalResults = await TestResult_1.default.countDocuments();
            const avgPercentage = await TestResult_1.default.aggregate([
                { $group: { _id: null, avgPercentage: { $avg: '$percentage' } } }
            ]);
            doc.setFontSize(10);
            doc.text(`Jami natijalar: ${totalResults}`, 20, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha foiz: ${avgPercentage[0]?.avgPercentage ? Math.round(avgPercentage[0].avgPercentage) : 0}%`, 20, yPosition);
        }
        return Buffer.from(doc.output('arraybuffer'));
    }
}
exports.PDFService = PDFService;
//# sourceMappingURL=PDFService.js.map