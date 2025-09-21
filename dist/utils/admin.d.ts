export declare const addTest: (testData: {
    title: string;
    description: string;
    questions: Array<{
        id: string;
        question: string;
        options: string[];
        correctAnswer: string;
        explanation?: string;
    }>;
    timeLimit?: number;
}) => Promise<import("mongoose").Document<unknown, {}, import("../interfaces/Test").ITest, {}, {}> & import("../interfaces/Test").ITest & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export declare const listTests: () => Promise<(import("mongoose").Document<unknown, {}, import("../interfaces/Test").ITest, {}, {}> & import("../interfaces/Test").ITest & Required<{
    _id: unknown;
}> & {
    __v: number;
})[]>;
export declare const deactivateTest: (testId: string) => Promise<(import("mongoose").Document<unknown, {}, import("../interfaces/Test").ITest, {}, {}> & import("../interfaces/Test").ITest & Required<{
    _id: unknown;
}> & {
    __v: number;
}) | null>;
//# sourceMappingURL=admin.d.ts.map