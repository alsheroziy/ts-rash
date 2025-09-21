import { Context } from 'telegraf';
export declare class AdminController {
    static hasActiveSession(telegramId: number): boolean;
    static start(ctx: Context): Promise<void>;
    static handleMessage(ctx: Context): Promise<void>;
    static handleCallbackQuery(ctx: Context): Promise<void>;
    static showTestsAndCreateOption(ctx: Context): Promise<void>;
    private static promptNextAnswer;
}
export default AdminController;
//# sourceMappingURL=AdminController.d.ts.map