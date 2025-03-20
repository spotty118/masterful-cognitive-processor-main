import { CodeChange, FileChange } from '../recommendations/MCPRecommendation';

export class CodeChangeProcessor {
    static createChangeSet(originalCode: string, changes: CodeChange[]): string {
        const lines = originalCode.split('\n');
        const sortedChanges = [...changes].sort((a, b) => 
            (b.startLine || 0) - (a.startLine || 0));

        for (const change of sortedChanges) {
            if (change.startLine && change.endLine) {
                const beforeLines = lines.slice(0, change.startLine - 1);
                const afterLines = lines.slice(change.endLine);
                const changeLines = change.replacement.split('\n');
                
                lines.splice(
                    change.startLine - 1,
                    change.endLine - change.startLine + 1,
                    '// ...existing code...',
                    ...changeLines,
                    '// ...existing code...'
                );
            }
        }

        return lines.join('\n');
    }

    static validateChange(change: CodeChange): boolean {
        if (!change.replacement) return false;
        if (change.startLine && !change.endLine) return false;
        if (change.endLine && !change.startLine) return false;
        if (change.startLine && change.endLine && change.startLine > change.endLine) return false;
        return true;
    }
}
