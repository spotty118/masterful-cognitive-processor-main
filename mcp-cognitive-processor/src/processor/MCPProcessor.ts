// Define CodeChange interface locally since it's not available in types.js
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

class MCPRecommendationImpl implements MCPRecommendation {
    private fileChanges: Array<{
        filePath: string;
        changes: CodeChange[];
    }> = [];

    getFileChanges() {
        return this.fileChanges;
    }

    addFileChange(filePath: string, change: CodeChange) {
        let fileChange = this.fileChanges.find(fc => fc.filePath === filePath);
        if (!fileChange) {
            fileChange = { filePath, changes: [] };
            this.fileChanges.push(fileChange);
        }
        fileChange.changes.push(change);
    }
}

interface AnalysisIssue {
    filePath: string;
    lineNumber?: number;
    recommendation: string;
    explanation: string;
    severity?: 'low' | 'medium' | 'high';
    category?: string;
}

interface AnalysisResult {
    issues: AnalysisIssue[];
    summary?: string;
}

interface AnalysisOptions {
    maxLineLength?: number;
    checkTodos?: boolean;
    checkMagicNumbers?: boolean;
    checkLongLines?: boolean;
    checkNestedPromises?: boolean;
    minSeverity?: 'low' | 'medium' | 'high';
}

export class MCPProcessor {
    private context: string;
    private codeSnippet: string;
    private filePath: string;
    private options: AnalysisOptions;

    constructor(
        context: string, 
        codeSnippet: string, 
        filePath: string = 'unknown-file.ts',
        options: AnalysisOptions = {}
    ) {
        this.context = context;
        this.codeSnippet = codeSnippet;
        this.filePath = filePath;
        this.options = {
            maxLineLength: 100,
            checkTodos: true,
            checkMagicNumbers: true,
            checkLongLines: true,
            checkNestedPromises: true,
            minSeverity: 'low',
            ...options
        };
    }

    async analyzeCode(): Promise<MCPRecommendation> {
        const recommendation = new MCPRecommendationImpl();

        try {
            const analysis = await this.performAnalysis();
            
            if (analysis.issues.length > 0) {
                analysis.issues.forEach(issue => {
                    const change: CodeChange = {
                        startLine: issue.lineNumber,
                        endLine: issue.lineNumber,
                        replacement: issue.recommendation,
                        explanation: issue.explanation
                    };
                    recommendation.addFileChange(issue.filePath, change);
                });
            } else {
                throw new Error("No actionable recommendations found in the analysis");
            }
        } catch (error) {
            const change: CodeChange = {
                replacement: "// Unable to process code",
                explanation: `Error during analysis: ${error instanceof Error ? error.message : String(error)}`
            };
            recommendation.addFileChange(this.filePath, change);
        }

        return recommendation;
    }

    private async performAnalysis(): Promise<AnalysisResult> {
        const issues: AnalysisIssue[] = [];
        
        try {
            // Parse code into AST or perform regex-based analysis
            const codeLines = this.codeSnippet.split('\n');
            
            // Analyze code structure and patterns
            for (let i = 0; i < codeLines.length; i++) {
                const line = codeLines[i];
                
                // Check for potential code quality issues
                if (this.options.checkTodos && (line.includes('TODO') || line.includes('FIXME'))) {
                    issues.push({
                        filePath: this.filePath,
                        lineNumber: i,
                        recommendation: 'Implement or fix TODO/FIXME comments',
                        explanation: `Found unresolved comment: ${line.trim()}`,
                        severity: 'low',
                        category: 'documentation'
                    });
                }

                // Check for magic numbers
                const magicNumberRegex = /(?<![\w.])[0-9]+(?![\w.])/;
                if (magicNumberRegex.test(line) && !line.trim().startsWith('//')) {
                    issues.push({
                        filePath: this.filePath,
                        lineNumber: i,
                        recommendation: 'Consider extracting magic number to a named constant',
                        explanation: `Found magic number in code: ${line.trim()}`
                    });
                }

                // Check for long lines
                if (line.length > 100) {
                    issues.push({
                        filePath: this.filePath,
                        lineNumber: i,
                        recommendation: 'Consider breaking long line into multiple lines',
                        explanation: 'Line exceeds recommended length of 100 characters'
                    });
                }

                // Check for nested callbacks/promises
                if ((line.includes('.then(') || line.includes('.catch(')) && 
                    codeLines.slice(Math.max(0, i-3), i).some(l => l.includes('.then('))) {
                    issues.push({
                        filePath: this.filePath,
                        lineNumber: i,
                        recommendation: 'Consider using async/await instead of nested promises',
                        explanation: 'Found nested promise chains which could be simplified'
                    });
                }
            }

            // Analyze the overall code context
            if (this.context) {
                // Check for architectural patterns and best practices
                if (this.context.includes('interface') && !this.codeSnippet.includes('implements')) {
                    issues.push({
                        filePath: this.filePath,
                        recommendation: 'Consider implementing available interfaces',
                        explanation: 'Found interfaces in context but no implementations in code'
                    });
                }

                // Check for missing error handling
                if (this.codeSnippet.includes('async') && !this.codeSnippet.includes('try')) {
                    issues.push({
                        filePath: this.filePath,
                        recommendation: 'Add error handling for async operations',
                        explanation: 'Found async functions without try-catch blocks'
                    });
                }
            }

        } catch (error) {
            issues.push({
                filePath: "analyzed-file.ts", // Fix: Use a placeholder file path
                recommendation: '// Analysis failed',
                explanation: `Error analyzing code: ${error instanceof Error ? error.message : String(error)}`
            });
        }

        return { issues };
    }
}