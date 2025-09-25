export declare class PDFService {
    private static savePDFToUpload;
    private static buildResultsHtml;
    static generateRashModelPDF_HTML(testId?: string): Promise<{
        buffer: Buffer;
        filePath: string;
    }>;
    static generateRashModelPDF(testId?: string): Promise<{
        buffer: Buffer;
        filePath: string;
    }>;
    static generateResultsPDFWithNames(testId?: string): Promise<{
        buffer: Buffer;
        filePath: string;
    }>;
    static generateResultsPDF(testId?: string): Promise<{
        buffer: Buffer;
        filePath: string;
    }>;
    static generateAnonymousResultsPDF(testId?: string): Promise<{
        buffer: Buffer;
        filePath: string;
    }>;
}
//# sourceMappingURL=PDFService.d.ts.map