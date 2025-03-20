export interface CodeChange {
    startLine?: number;
    endLine?: number;
    original?: string;
    replacement: string;
    explanation: string;
}

export interface FileChange {
    filePath: string;
    changes: CodeChange[];
    isNewFile: boolean;
}

export class MCPRecommendation {
    private fileChanges: Map<string, FileChange> = new Map();

    addFileChange(filePath: string, change: CodeChange, isNewFile: boolean = false) {
        const existing = this.fileChanges.get(filePath) || {
            filePath,
            changes: [],
            isNewFile
        };
        existing.changes.push(change);
        this.fileChanges.set(filePath, existing);
    }

    formatRecommendation(): string {
        if (this.fileChanges.size === 0) {
            return "No specific code changes recommended.";
        }

        return Array.from(this.fileChanges.values())
            .map(file => this.formatFileChange(file))
            .join('\n\n');
    }

    private formatFileChange(file: FileChange): string {
        const header = `### ${file.filePath}\n`;
        const changes = file.changes.map(change => {
            let location = '';
            if (change.startLine && change.endLine) {
                location = ` (lines ${change.startLine}-${change.endLine})`;
            }
            
            return `${change.explanation}${location}\n\`\`\`typescript
// filepath: ${file.filePath}
${change.replacement}
\`\`\``;
        }).join('\n\n');

        return `${header}${changes}`;
    }

    getFileChanges(): FileChange[] {
        return Array.from(this.fileChanges.values());
    }
}
