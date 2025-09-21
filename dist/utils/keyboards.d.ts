import { Markup } from 'telegraf';
export declare const getMainMenuKeyboard: () => Markup.Markup<import("@telegraf/types").ReplyKeyboardMarkup>;
export declare const getTestSelectionKeyboard: (tests: any[]) => Markup.Markup<import("@telegraf/types").ReplyKeyboardMarkup>;
export declare const getAnswerKeyboard: (options: string[]) => {
    inline_keyboard: {
        text: string;
        callback_data: string;
    }[][];
};
export declare const getTestNavigationKeyboard: () => Markup.Markup<import("@telegraf/types").ReplyKeyboardMarkup>;
export declare const getConfirmationKeyboard: () => Markup.Markup<import("@telegraf/types").ReplyKeyboardMarkup>;
export declare const getBackKeyboard: () => Markup.Markup<import("@telegraf/types").ReplyKeyboardMarkup>;
export declare const getPhoneKeyboard: () => Markup.Markup<import("@telegraf/types").ReplyKeyboardMarkup>;
//# sourceMappingURL=keyboards.d.ts.map