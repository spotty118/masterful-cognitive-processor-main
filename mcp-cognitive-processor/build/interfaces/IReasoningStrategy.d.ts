export interface IReasoningStrategy {
    selectReasoningSystem(problem: string): Promise<{
        name: string;
        description: string;
        implementation: string;
    }>;
}
