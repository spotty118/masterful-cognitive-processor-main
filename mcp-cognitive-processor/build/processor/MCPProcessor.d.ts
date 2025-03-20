export interface CodeChange {
    startLine?: number;
    endLine?: number;
    replacement: string;
    explanation: string;
}
export interface MCPRecommendation {
    getFileChanges(): Array<{
        filePath: string;
        changes: CodeChange[];
    }>;
    addFileChange(filePath: string, change: CodeChange): void;
}
interface AnalysisOptions {
    maxLineLength?: number;
    checkTodos?: boolean;
    checkMagicNumbers?: boolean;
    checkLongLines?: boolean;
    checkNestedPromises?: boolean;
    minSeverity?: 'low' | 'medium' | 'high';
}
export declare class MCPProcessor {
    private context;
    private codeSnippet;
    private filePath;
    private options;
    constructor(context: string, codeSnippet: string, filePath?: string, options?: AnalysisOptions);
    analyzeCode(): Promise<MCPRecommendation>;
    private performAnalysis;
}
export {};
