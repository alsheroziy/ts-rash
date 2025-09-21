import { ITestResult } from '../interfaces/TestResult';
import { ITest } from '../interfaces/Test';
export declare class PDFService {
    /**
     * Generate PDF for test results
     */
    static generateTestResultPDF(testResult: ITestResult, test: ITest, userInfo: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
    }): Promise<string>;
    /**
     * Generate PDF for all test results (admin function)
     */
    static generateAllResultsPDF(testResults: ITestResult[], test: ITest): Promise<string>;
}
//# sourceMappingURL=PDFService.d.ts.map