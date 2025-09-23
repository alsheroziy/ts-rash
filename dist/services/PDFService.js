"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFService = void 0;
const jspdf_1 = __importDefault(require("jspdf"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const TestResult_1 = __importDefault(require("../models/TestResult"));
const Test_1 = __importDefault(require("../models/Test"));
const User_1 = __importDefault(require("../models/User"));
class PDFService {
    static buildResultsHtml(title, rows) {
        const tableRows = rows.map(r => `
      <tr>
        <td>${r.no}</td>
        <td>${r.name}</td>
        <td>${r.correct}</td>
        <td>${r.ball}</td>
        <td>${r.grade}</td>
      </tr>
    `).join('');
        return `<!DOCTYPE html>
    <html lang="uz"><head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Helvetica, Arial, sans-serif; }
        .top { font-family: 'Times New Roman', serif; font-style: italic; font-size: 11px; display:flex; justify-content: space-between; }
        .band { background:#e6e6e6; padding:8px 12px; text-align:center; font-weight:700; font-size:11px; }
        h2 { margin: 12px 0 8px; font-size:14px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border:1px solid #000; padding:6px 8px; text-align:center; }
        th:nth-child(2), td:nth-child(2) { text-align: left; }
        th { font-weight:700; }
      </style>
    </head><body>
      <div class="top"><div>Milliy sertifikat</div><div>Sherzod Abduxalimov, Davron Akbar</div></div>
      <div class="band">DAVRON AKBAR TOMONIDAN O'TKAZILGAN MILLIY SERTIFIKAT IMTIHONIDA TALABGORLARNING RASH MODELI BO'YICHA TEKSHIRILGAN TEST NATIJALARI</div>
      <h2>${title}</h2>
      <table>
        <thead>
          <tr>
            <th style="width:6%">!</th>
            <th>Ism va familiya</th>
            <th style="width:18%">To'g'ri javoblar soni</th>
            <th style="width:12%">Ball</th>
            <th style="width:12%">Daraja</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </body></html>`;
    }
    static async generateRashModelPDF_HTML(testId) {
        if (testId) {
            const test = await Test_1.default.findById(testId);
            const results = await TestResult_1.default.find({ testId }).sort({ rashScore: -1 });
            if (!test)
                throw new Error('Test topilmadi');
            const rows = [];
            for (let i = 0; i < results.length; i++) {
                const r = results[i];
                let user = null;
                const userIdNum = Number(r.userId);
                if (!isNaN(userIdNum))
                    user = await User_1.default.findOne({ telegramId: userIdNum });
                else
                    user = await User_1.default.findById(r.userId);
                const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "Noma'lum";
                const ball = (r.rashScore ?? 0).toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                rows.push({ no: i + 1, name, correct: r.correctAnswers, ball, grade: r.grade });
            }
            const html = this.buildResultsHtml(`Test: ${test.title}`, rows);
            const browser = await puppeteer_1.default.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            const buffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', right: '10mm', bottom: '15mm', left: '10mm' } });
            await browser.close();
            return Buffer.from(buffer);
        }
        // All results (compact)
        const results = await TestResult_1.default.find({}).populate('testId', 'title').sort({ rashScore: -1 }).limit(100);
        const rows = [];
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            let user = null;
            const userIdNum = Number(r.userId);
            if (!isNaN(userIdNum))
                user = await User_1.default.findOne({ telegramId: userIdNum });
            else
                user = await User_1.default.findById(r.userId);
            const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "Noma'lum";
            const title = r.testId?.title || 'Noma\'lum test';
            const ball = (r.rashScore ?? 0).toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            rows.push({ no: i + 1, name: `${name} — ${title}`, correct: r.correctAnswers, ball, grade: r.grade });
        }
        const html = this.buildResultsHtml('Barcha test natijalari (Rash modeli)', rows);
        const browser = await puppeteer_1.default.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const buffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', right: '10mm', bottom: '15mm', left: '10mm' } });
        await browser.close();
        return Buffer.from(buffer);
    }
    static async generateRashModelPDF(testId) {
        const doc = new jspdf_1.default();
        // Base font
        doc.setFont('helvetica');
        let yPosition = 20;
        if (testId) {
            // Generate PDF for specific test
            const test = await Test_1.default.findById(testId);
            const results = await TestResult_1.default.find({ testId })
                .sort({ rashScore: -1 }); // Sort by Rash score descending
            if (!test) {
                throw new Error('Test topilmadi');
            }
            // Top italic header like sample
            doc.setFont('times', 'italic');
            doc.setFontSize(11);
            doc.text('Milliy sertifikat', 20, yPosition);
            doc.text('Sherzod Abduxalimov, Davron Akbar', 190, yPosition, { align: 'right' });
            yPosition += 8;
            // Centered grey band title
            doc.setFillColor(230, 230, 230);
            doc.rect(20, yPosition, 170, 12, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text("DAVRON AKBAR TOMONIDAN O'TKAZILGAN MILLIY SERTIFIKAT IMTIHONIDA TALABGORLARNING RASH MODELI BO'YICHA TEKSHIRILGAN TEST NATIJALARI", 105, yPosition + 8, { align: 'center', maxWidth: 165 });
            yPosition += 18;
            doc.setFont('helvetica', 'normal');
            // Test title
            doc.setFontSize(14);
            doc.text(`Test: ${test.title}`, 20, yPosition);
            yPosition += 10;
            if (results.length === 0) {
                doc.setFontSize(12);
                doc.text('Bu test uchun natijalar yo\'q', 20, yPosition);
                return Buffer.from(doc.output('arraybuffer'));
            }
            // Table column positions to mimic sample
            const colNo = 20; // left
            const colName = 35; // after !
            const colCorrect = 120;
            const colBall = 150;
            const colGrade = 175;
            const tableRight = 190;
            // Header row with full borders
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            const headerTop = yPosition - 8;
            // Outer header box
            doc.line(20, headerTop, tableRight, headerTop);
            doc.line(20, headerTop + 12, tableRight, headerTop + 12);
            // Vertical lines
            doc.line(20, headerTop, 20, headerTop + 12);
            doc.line(colName, headerTop, colName, headerTop + 12);
            doc.line(colCorrect, headerTop, colCorrect, headerTop + 12);
            doc.line(colBall, headerTop, colBall, headerTop + 12);
            doc.line(colGrade, headerTop, colGrade, headerTop + 12);
            doc.line(tableRight, headerTop, tableRight, headerTop + 12);
            // Header labels (centered)
            doc.text('!', (20 + colName) / 2, yPosition, { align: 'center' });
            doc.text('Ism va familiya', (colName + colCorrect) / 2, yPosition, { align: 'center' });
            doc.text("To'g'ri\njavoblar\nsoni", (colCorrect + colBall) / 2, yPosition - 3, { align: 'center' });
            doc.text('Ball', (colBall + colGrade) / 2, yPosition, { align: 'center' });
            doc.text('Daraja', (colGrade + tableRight) / 2, yPosition, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            yPosition += 12;
            // Results data with individual row borders
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
                // Draw row borders
                const rowTop = yPosition - 8;
                doc.line(20, rowTop, tableRight, rowTop);
                doc.line(20, rowTop + 8, tableRight, rowTop + 8);
                doc.line(20, rowTop, 20, rowTop + 8);
                doc.line(colName, rowTop, colName, rowTop + 8);
                doc.line(colCorrect, rowTop, colCorrect, rowTop + 8);
                doc.line(colBall, rowTop, colBall, rowTop + 8);
                doc.line(colGrade, rowTop, colGrade, rowTop + 8);
                doc.line(tableRight, rowTop, tableRight, rowTop + 8);
                const rashText = (result.rashScore ?? 0).toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                // Centered cell texts
                doc.text(`${i + 1}`, (20 + colName) / 2, yPosition, { align: 'center' });
                doc.text(userName.substring(0, 32), (colName + colCorrect) / 2, yPosition, { align: 'center' });
                doc.text(`${result.correctAnswers}`, (colCorrect + colBall) / 2, yPosition, { align: 'center' });
                doc.text(rashText, (colBall + colGrade) / 2, yPosition, { align: 'center' });
                doc.text(`${result.grade}`, (colGrade + tableRight) / 2, yPosition, { align: 'center' });
                yPosition += 8;
            }
            // Statistics section placed clearly below table, centered heading
            yPosition += 12;
            if (yPosition > 260) {
                doc.addPage();
                yPosition = 20;
            }
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Statistika', 105, yPosition, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            yPosition += 10;
            const totalAttempts = results.length;
            const avgRashScore = results.reduce((sum, r) => sum + r.rashScore, 0) / totalAttempts;
            const bestRashScore = Math.max(...results.map(r => r.rashScore));
            const worstRashScore = Math.min(...results.map(r => r.rashScore));
            // Grade distribution
            const gradeDistribution = results.reduce((acc, r) => {
                acc[r.grade] = (acc[r.grade] || 0) + 1;
                return acc;
            }, {});
            doc.setFontSize(10);
            doc.text(`Jami urinishlar: ${totalAttempts}`, 25, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha Rash ball: ${Math.round(avgRashScore * 100) / 100}`, 25, yPosition);
            yPosition += 8;
            doc.text(`Eng yaxshi natija: ${bestRashScore}`, 25, yPosition);
            yPosition += 8;
            doc.text(`Eng yomon natija: ${worstRashScore}`, 25, yPosition);
            yPosition += 8;
            // Grade distribution
            doc.text('Daraja taqsimoti:', 25, yPosition);
            yPosition += 8;
            Object.entries(gradeDistribution).forEach(([grade, count]) => {
                doc.text(`${grade}: ${count} ta`, 35, yPosition);
                yPosition += 6;
            });
        }
        else {
            // Generate PDF for all results
            const results = await TestResult_1.default.find({})
                .populate('testId', 'title')
                .sort({ rashScore: -1 })
                .limit(100);
            if (results.length === 0) {
                doc.setFontSize(12);
                doc.text('Hozircha natijalar yo\'q', 20, yPosition);
                return Buffer.from(doc.output('arraybuffer'));
            }
            doc.setFontSize(14);
            doc.text('Barcha test natijalari (Rash modeli)', 20, yPosition);
            yPosition += 20;
            // Results table header
            doc.setFontSize(10);
            doc.text('!', 20, yPosition);
            doc.text('Ism va familiya', 35, yPosition);
            doc.text('Test', 100, yPosition);
            doc.text('To\'g\'ri javoblar', 140, yPosition);
            doc.text('Ball', 170, yPosition);
            doc.text('Daraja', 190, yPosition);
            // Draw table borders - header row
            const headerY = yPosition - 8;
            doc.line(20, headerY, 200, headerY); // Top line
            doc.line(20, headerY + 10, 200, headerY + 10); // Bottom line of header
            // Draw vertical lines for header
            doc.line(20, headerY, 20, headerY + 10); // Left line
            doc.line(35, headerY, 35, headerY + 10); // After №
            doc.line(100, headerY, 100, headerY + 10); // After name
            doc.line(140, headerY, 140, headerY + 10); // After test
            doc.line(170, headerY, 170, headerY + 10); // After correct answers
            doc.line(190, headerY, 190, headerY + 10); // After score
            doc.line(200, headerY, 200, headerY + 10); // Right line
            yPosition += 10;
            // Results data with individual row borders
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
                // Draw row borders
                const rowY = yPosition - 8;
                doc.line(20, rowY, 200, rowY); // Top line of row
                doc.line(20, rowY + 8, 200, rowY + 8); // Bottom line of row
                // Draw vertical lines for row
                doc.line(20, rowY, 20, rowY + 8); // Left line
                doc.line(35, rowY, 35, rowY + 8); // After №
                doc.line(100, rowY, 100, rowY + 8); // After name
                doc.line(140, rowY, 140, rowY + 8); // After test
                doc.line(170, rowY, 170, rowY + 8); // After correct answers
                doc.line(190, rowY, 190, rowY + 8); // After score
                doc.line(200, rowY, 200, rowY + 8); // Right line
                doc.text(`${i + 1}`, 20, yPosition);
                doc.text(userName.substring(0, 20), 35, yPosition); // Limit name length
                doc.text(truncatedTitle, 100, yPosition);
                doc.text(`${result.correctAnswers}`, 140, yPosition);
                doc.text(`${result.rashScore}`, 170, yPosition);
                doc.text(`${result.grade}`, 190, yPosition);
                yPosition += 8;
            }
            // Overall statistics
            yPosition += 10;
            doc.setFontSize(12);
            doc.text('Umumiy statistika:', 20, yPosition);
            yPosition += 10;
            const totalResults = await TestResult_1.default.countDocuments();
            const avgRashScore = await TestResult_1.default.aggregate([
                { $group: { _id: null, avgRashScore: { $avg: '$rashScore' } } }
            ]);
            doc.setFontSize(10);
            doc.text(`Jami natijalar: ${totalResults}`, 20, yPosition);
            yPosition += 8;
            doc.text(`O'rtacha Rash ball: ${avgRashScore[0]?.avgRashScore ? Math.round(avgRashScore[0].avgRashScore * 100) / 100 : 0}`, 20, yPosition);
        }
        return Buffer.from(doc.output('arraybuffer'));
    }
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