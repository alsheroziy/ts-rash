"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelService = void 0;
class ChannelService {
    /**
     * Check if user is member of the required channel
     */
    static async isUserMemberOfChannel(ctx) {
        try {
            const userId = ctx.from?.id;
            if (!userId)
                return false;
            console.log(`🔍 Checking channel membership for user ${userId} in channel ${this.CHANNEL_ID}`);
            // Check if user is member of the channel
            const member = await ctx.telegram.getChatMember(this.CHANNEL_ID, userId);
            console.log(`📊 User ${userId} channel status:`, member.status);
            // User is member if status is 'member', 'administrator', or 'creator'
            const validStatuses = ['member', 'administrator', 'creator'];
            const isMember = validStatuses.includes(member.status);
            console.log(`✅ User ${userId} is member:`, isMember);
            return isMember;
        }
        catch (error) {
            console.error('❌ Channel membership check error:', error);
            console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                response: error?.response
            });
            // If we can't check membership, we'll be more permissive for now
            // This prevents blocking users due to API issues
            console.log('⚠️ Allowing access due to API error (temporary)');
            return true;
        }
    }
    /**
     * Send channel join prompt to user
     */
    static async sendChannelJoinPrompt(ctx) {
        const message = `🔒 *Test yechish uchun kanalga a'zo bo'lish kerak!*

📢 *O'ZBEK TILI VA ADABIYOTI. MILLIY SERTIFIKAT* kanaliga qo'shiling:

🔗 ${this.REQUIRED_CHANNEL}

Kanalga qo'shilgandan so'ng, botni qayta ishga tushiring va test yechishni davom ettiring.

⚠️ *Eslatma:* Kanalga qo'shilmasangiz, test yechish imkoniyati bo'lmaydi.`;
        await ctx.reply(message, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                        {
                            text: '📢 Kanalga qo\'shilish',
                            url: `https://t.me/${this.CHANNEL_ID.replace('@', '')}`
                        }
                    ], [
                        {
                            text: '🔄 Tekshirish',
                            callback_data: 'check_channel_membership'
                        }
                    ]]
            }
        });
    }
    /**
     * Get channel information for display
     */
    static getChannelInfo() {
        return `📢 *O'ZBEK TILI VA ADABIYOTI. MILLIY SERTIFIKAT*

🔗 Kanal: ${this.REQUIRED_CHANNEL}
👥 A'zolar: 23,232+
📚 Maqsad: Milliy sertifikat, attestatsiya, kirish imtihonlari

Ustozlar: A.Boymirzayev, S.Nazirov
☎️ +998900748464`;
    }
}
exports.ChannelService = ChannelService;
ChannelService.REQUIRED_CHANNEL = '@Ona_tili_va_adabiyot_BMBA';
ChannelService.CHANNEL_ID = '@Ona_tili_va_adabiyot_BMBA';
//# sourceMappingURL=ChannelService.js.map