import { Context } from 'telegraf';
export declare class TestController {
    static showTestSelection(ctx: Context, opts?: {
        force?: boolean;
    }): Promise<void>;
    static startTest(ctx: Context, testTitle: string): Promise<void>;
    static showQuestion(ctx: Context, testId: string, questionIndex?: number): Promise<void>;
    static handleAnswer(ctx: Context, answer: string): Promise<void>;
    static completeTest(ctx: Context, testId: string): Promise<void>;
    static continueCurrentTest(ctx: Context): Promise<void>;
    static startNewTest(ctx: Context): Promise<void>;
    static completeCurrentTest(ctx: Context): Promise<void>;
    static nextQuestion(ctx: Context): Promise<void>;
}
//# sourceMappingURL=TestController.d.ts.map