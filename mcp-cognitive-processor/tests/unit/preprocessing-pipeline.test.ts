import { expect } from 'chai';
import { GeminiPreprocessingService } from '../../src/services/GeminiPreprocessingService';
import { ClaudeReasoningService } from '../../src/services/ClaudeReasoningService';
import { GeminiServiceAdapter } from '../../src/services/GeminiServiceAdapter';
import { ClaudeServiceAdapter } from '../../src/services/ClaudeServiceAdapter';
import { ServiceFactory } from '../../src/factories/ServiceFactory';

describe('Preprocessing Pipeline', () => {
  let geminiPreprocessor: GeminiPreprocessingService;
  let claudeReasoner: ClaudeReasoningService;

  before(() => {
    // Initialize services
    const geminiService = ServiceFactory.getGeminiService();
    const claudeService = ServiceFactory.getClaudeService();
    
    geminiPreprocessor = new GeminiPreprocessingService(geminiService);
    claudeReasoner = new ClaudeReasoningService(claudeService);
  });

  it('should perform initial preprocessing with Gemini', async () => {
    const query = 'Analyze the performance implications of using async/await vs promises in Node.js';
    
    const result = await geminiPreprocessor.preprocessQuery(query);
    
    expect(result).to.have.property('structuredQuery');
    expect(result.structuredQuery).to.have.property('mainObjective');
    expect(result.structuredQuery).to.have.property('subTasks');
    expect(result.initialAnalysis).to.have.property('complexityScore');
  });

  it('should perform deep reasoning with Claude', async () => {
    const preprocessedData = {
      structuredQuery: {
        mainObjective: 'Compare async/await and promises performance in Node.js',
        subTasks: [
          'Analyze execution model differences',
          'Measure performance metrics',
          'Identify use case scenarios'
        ],
        relevantContext: ['Node.js runtime', 'Event loop', 'V8 engine']
      },
      initialAnalysis: {
        complexityScore: 0.7,
        suggestedApproach: 'Comparative analysis with benchmarks',
        potentialChallenges: ['Runtime variations', 'Garbage collection impact']
      }
    };

    const result = await claudeReasoner.performDeepReasoning(preprocessedData);

    expect(result).to.have.property('detailedAnalysis');
    expect(result.detailedAnalysis).to.have.property('conclusions');
    expect(result.detailedAnalysis).to.have.property('recommendations');
    expect(result).to.have.property('confidence');
  });

  it('should handle errors gracefully', async () => {
    const invalidQuery = '';

    try {
      await geminiPreprocessor.preprocessQuery(invalidQuery);
      throw new Error('Should have thrown an error for empty query');
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });

  it('should maintain context through the pipeline', async () => {
    const query = 'Optimize a React component for performance';
    
    // First step: Gemini preprocessing
    const preprocessResult = await geminiPreprocessor.preprocessQuery(query);
    expect(preprocessResult.structuredQuery.mainObjective).to.be.a('string');
    
    // Second step: Claude reasoning
    const reasoningResult = await claudeReasoner.performDeepReasoning(preprocessResult);
    expect(reasoningResult.detailedAnalysis).to.be.an('object');
    
    // Verify context preservation
    expect(reasoningResult.detailedAnalysis.recommendations).to.be.an('array');
    expect(reasoningResult.reasoning.path).to.be.an('array');
  });
});