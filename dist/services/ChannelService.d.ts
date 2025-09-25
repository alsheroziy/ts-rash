import { Context } from 'telegraf';
export declare class ChannelService {
    private static readonly REQUIRED_CHANNEL;
    private static readonly CHANNEL_ID;
    /**
     * Check if user is member of the required channel
     */
    static isUserMemberOfChannel(ctx: Context): Promise<boolean>;
    /**
     * Send channel join prompt to user
     */
    static sendChannelJoinPrompt(ctx: Context): Promise<void>;
    /**
     * Get channel information for display
     */
    static getChannelInfo(): string;
}
//# sourceMappingURL=ChannelService.d.ts.map