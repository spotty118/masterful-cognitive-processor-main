/**
 * Orchestrates the step-by-step processing pipeline using multiple AI models
 * Each step processes the output from the previous step in a sequential manner
 */

import { IAIService } from '../interfaces/IAIService.js';
import { LLMRequest, LLMResponse } from '../models/types.js';

// Define a token interface for passing structured information between steps
interface StepToken {
  originalQuery: string;
  phase: 'preprocessing' | 'processing' | 'reasoning';
  completedSteps: number[];
  entitiesExtracted: string[];
  themesIdentified: string[];
  relationshipsIdentified: string[];
  conclusionsDrawn: string[];
  requestForNextStep?: string;
  analysisState: {
    [key: string]: unknown;
  };
}

export interface PipelineStep {
  name: string;
  service: IAIService;
  systemPrompt?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PipelineResult {
  finalResponse: LLMResponse;
  intermediateResults: LLMResponse[];
  success: boolean;
  error?: Error;
  totalLatency: number;
  totalTokens: number;
}

export class ProcessingPipelineOrchestrator {
  private steps: PipelineStep[] = [];
  private debugMode: boolean = false;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  /**
   * Add a step to the processing pipeline
   * Steps will be executed in the order they are added
   */
  public addStep(step: PipelineStep): void {
    this.steps.push(step);
    if (this.debugMode) {
      console.log(`Pipeline step added: ${step.name} using model ${step.model}`);
    }
  }

  /**
   * Execute the pipeline steps sequentially
   * Each step receives the output from the previous step
   */
  public async execute(initialPrompt: string): Promise<PipelineResult> {
    if (this.steps.length === 0) {
      throw new Error('Pipeline has no steps configured');
    }

    console.log(`Starting processing pipeline with ${this.steps.length} steps`);
    const startTime = Date.now();
    const intermediateResults: LLMResponse[] = [];
    const originalPrompt = initialPrompt; // Store the original prompt
    
    // Initialize the token that will be passed between steps
    const stepToken: StepToken = {
      originalQuery: initialPrompt,
      phase: 'preprocessing',
      completedSteps: [],
      entitiesExtracted: [],
      themesIdentified: [],
      relationshipsIdentified: [],
      conclusionsDrawn: [],
      analysisState: {}
    };
    let currentPrompt = initialPrompt;    // Current prompt that gets updated with each step
    let finalResponse: LLMResponse | null = null;
    let totalTokens = 0;
    
    try {
      // Process each step in sequence with clear separation
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        const stepNumber = i + 1;
        
        console.log(`-------------------------------------------------------`);
        console.log(`EXECUTING PIPELINE STEP ${stepNumber}/${this.steps.length}: ${step.name}`);
        console.log(`Using model: ${step.model}`);
        console.log(`-------------------------------------------------------`);
        
        // Add a small delay between steps to ensure separation
        if (i > 0) {
          console.log(`Adding separation delay between steps ${i} and ${stepNumber}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Build step-specific system prompts with clear handoff instructions
        let enhancedSystemPrompt = `${step.systemPrompt || ''}`;
        
        // Add step-specific role and handoff instructions
        if (stepNumber === 1) {
          enhancedSystemPrompt += `\n\nIMPORTANT: You are step ${stepNumber} in a ${this.steps.length}-step pipeline.
Your role is PREPROCESSING ONLY. You should:
1. Extract key entities and information from the input - DO NOT perform in-depth analysis
2. Identify main topics and themes at a surface level
3. Organize the extracted information in a structured format
4. DO NOT draw conclusions or perform deep analysis - that is for later steps
5. Begin your response with "STEP 1 ANALYSIS:" followed by your extraction of key information
6. End with "TOKEN PASS: [brief description of what step 2 should focus on]"
7. IMPORTANT: If you perform detailed analysis, step 2 and 3 will have nothing to do`;
        }
        else if (stepNumber === 2) {
          enhancedSystemPrompt += `\n\nIMPORTANT: You are step ${stepNumber} in a ${this.steps.length}-step pipeline.
Your role is ADVANCED PROCESSING ONLY. You should:
1. Review the information extracted by step 1
2. Focus on finding patterns, connections and relationships in the data
3. Add depth and context to the initial extraction - DO NOT perform final reasoning
4. Identify hidden patterns and non-obvious relationships
5. Begin your response with "STEP 2 ANALYSIS:" followed by your processing
6. End with "TOKEN PASS: [brief description of what step 3 should focus on]"
7. IMPORTANT: Do not draw final conclusions - leave that for step 3`;
        }
        else if (stepNumber === 3) {
          enhancedSystemPrompt += `\n\nIMPORTANT: You are step ${stepNumber} in a ${this.steps.length}-step pipeline.
Your role is FINAL REASONING. You should:
1. Review the analyses from steps 1 and 2
2. Apply critical thinking and reasoning to the processed information
3. Draw logical conclusions based on the patterns and relationships identified in step 2
4. Evaluate different perspectives and implications
5. Synthesize everything into a final coherent analysis
6. Begin your response with "STEP 3 ANALYSIS:" then provide your final reasoning
7. End with "PIPELINE COMPLETE: [brief summary of insights]"`;
        }
        
        // Create a unique identifier for this step to trace it
        const stepId = `step${stepNumber}_${Date.now()}`;
        console.log(`Step ${stepNumber} ID: ${stepId}`);
        
        // Format the prompt based on which step we're on
        let markedPrompt = '';
        if (stepNumber === 1) {
          // First step gets the original prompt directly
          markedPrompt = `[ORIGINAL QUERY]:\n${currentPrompt}\n\nProvide a comprehensive preprocessing analysis that will be handed off to step 2.`;
        } else {
          // Later steps get the previous step's output with clear instructions
          // Update token phase based on the step number
          if (stepNumber === 2) {
            stepToken.phase = 'processing';
          } else if (stepNumber === 3) {
            stepToken.phase = 'reasoning';
          }
          
          // Add the previous step to completed steps
          stepToken.completedSteps.push(stepNumber - 1);
          
          // Create a structured token-passing prompt
          markedPrompt =
`[ORIGINAL QUERY]:
${initialPrompt}

[OUTPUT FROM PREVIOUS STEP]:
${currentPrompt}

[CURRENT TOKEN STATE]:
Phase: ${stepToken.phase}
Completed steps: ${stepToken.completedSteps.join(', ')}

Build upon the previous step's analysis according to your role.
IMPORTANT: Focus only on your specific role as described in the system prompt.
Don't repeat work that was already done in previous steps.`;
        }
        
        const request: LLMRequest = {
          prompt: `${markedPrompt}\n[Step ID: ${stepId}]`,
          model: step.model,
          systemPrompt: `${enhancedSystemPrompt}\nStep ID: ${stepId}`,
          temperature: step.temperature || 0.7,
          maxTokens: step.maxTokens || 2000
        };

        console.log(`Step ${stepNumber} starting with model ${step.model}`);
        console.log(`Step ${stepNumber} system prompt: ${enhancedSystemPrompt}`);
        
        if (this.debugMode) {
          const previewLength = Math.min(currentPrompt.length, 200);
          console.log(`Step ${stepNumber} input preview (${previewLength}/${currentPrompt.length} chars):\n${currentPrompt.substring(0, previewLength)}${currentPrompt.length > previewLength ? '...' : ''}`);
        }
        
        // Execute current step
        console.log(`Sending request to service for step ${stepNumber}...`);
        const stepResult = await step.service.query(request);
        console.log(`Received response from service for step ${stepNumber}`);
        
        intermediateResults.push(stepResult);
        
        // Update running totals
        totalTokens += stepResult.tokenUsage?.total || 0;
        
        if (this.debugMode) {
          const previewLength = Math.min(stepResult.response.length, 200);
          console.log(`Step ${stepNumber} completed. Model: ${step.model}, Tokens: ${stepResult.tokenUsage?.total || 0}`);
          console.log(`Step ${stepNumber} output preview (${previewLength}/${stepResult.response.length} chars):\n${stepResult.response.substring(0, previewLength)}${stepResult.response.length > previewLength ? '...' : ''}`);
        }
        
        // Ensure the response has the proper step prefix
        const expectedPrefix = `STEP ${stepNumber} ANALYSIS:`;
        let formattedResponse = stepResult.response;
        
        // Check if the response already has any variant of the step indicator
        const containsExpectedPrefix =
            formattedResponse.toUpperCase().includes(expectedPrefix.toUpperCase()) ||
            formattedResponse.toUpperCase().includes(`STEP ${stepNumber}:`) ||
            formattedResponse.toUpperCase().includes(`STEP ${stepNumber} OUTPUT`);
        
        // Extract token passing information if present
        let tokenPass = '';
        const tokenPassMatch = formattedResponse.match(/TOKEN PASS:\s*(.*?)(?:\n|$)/i);
        if (tokenPassMatch && tokenPassMatch[1]) {
            tokenPass = tokenPassMatch[1].trim();
            console.log(`Token pass detected: "${tokenPass}"`);
            stepToken.requestForNextStep = tokenPass;
        }
        
        // For step 3, check for pipeline completion marker
        if (stepNumber === 3) {
            const pipelineCompleteMatch = formattedResponse.match(/PIPELINE COMPLETE:\s*(.*?)(?:\n|$)/i);
            if (pipelineCompleteMatch && pipelineCompleteMatch[1]) {
                console.log(`Pipeline completion marker detected: "${pipelineCompleteMatch[1].trim()}"`);
            }
        }
        
        // If it doesn't have the expected prefix, add it
        if (!containsExpectedPrefix) {
            console.log(`Adding step indicator prefix "${expectedPrefix}" to response`);
            formattedResponse = `${expectedPrefix}\n\n${formattedResponse}`;
        } else {
            console.log(`Response already contains step ${stepNumber} indicator`);
        }
        
        // Format the output with step markers before passing to the next step
        currentPrompt = formattedResponse;
        
        // Log the handoff
        // Update token with analysis state based on step
        if (stepNumber === 1) {
            // Parse entities and themes from step 1 if possible
            const entitiesMatch = formattedResponse.match(/entities:?\s*(.*?)(?:\n\n|\n(?=[A-Z]))/is);
            if (entitiesMatch) {
                stepToken.entitiesExtracted = entitiesMatch[1].split(/,|\n/).map((e: string) => e.trim()).filter((e: string) => e);
                console.log(`Extracted entities: ${stepToken.entitiesExtracted.length}`);
            }
            
            const themesMatch = formattedResponse.match(/themes:?\s*(.*?)(?:\n\n|\n(?=[A-Z]))/is);
            if (themesMatch) {
                stepToken.themesIdentified = themesMatch[1].split(/,|\n/).map((t: string) => t.trim()).filter((t: string) => t);
                console.log(`Identified themes: ${stepToken.themesIdentified.length}`);
            }
        } else if (stepNumber === 2) {
            // Parse relationships from step 2 if possible
            const relationshipsMatch = formattedResponse.match(/relationships:?\s*(.*?)(?:\n\n|\n(?=[A-Z]))/is);
            if (relationshipsMatch) {
                stepToken.relationshipsIdentified = relationshipsMatch[1].split(/,|\n/).map((r: string) => r.trim()).filter((r: string) => r);
                console.log(`Identified relationships: ${stepToken.relationshipsIdentified.length}`);
            }
        } else if (stepNumber === 3) {
            // Parse conclusions from step 3 if possible
            const conclusionsMatch = formattedResponse.match(/conclusions:?\s*(.*?)(?:\n\n|\n(?=[A-Z]))/is);
            if (conclusionsMatch) {
                stepToken.conclusionsDrawn = conclusionsMatch[1].split(/,|\n/).map((c: string) => c.trim()).filter((c: string) => c);
                console.log(`Drawn conclusions: ${stepToken.conclusionsDrawn.length}`);
            }
        }
        
        console.log(`Step ${stepNumber} completed. Handing off analysis to ${stepNumber < this.steps.length ? 'step ' + (stepNumber + 1) : 'final output'}`);
        console.log(`Token state: Phase=${stepToken.phase}, CompletedSteps=${stepToken.completedSteps.join(',')}`);
        
        // Store the final response from the last step
        if (i === this.steps.length - 1) {
          finalResponse = stepResult;
          console.log(`Final step ${stepNumber} completed, pipeline execution finished`);
        }
      }
      
      if (!finalResponse) {
        throw new Error('Pipeline execution failed to produce a final response');
      }
      
      const totalLatency = Date.now() - startTime;
      console.log(`Pipeline execution completed in ${totalLatency}ms, total tokens: ${totalTokens}`);
      
      return {
        finalResponse,
        intermediateResults,
        success: true,
        totalLatency,
        totalTokens
      };
      
    } catch (error) {
      console.error('Pipeline execution failed:', error);
      
      return {
        finalResponse: finalResponse || {
          response: '',
          model: '',
          tokenUsage: { prompt: 0, completion: 0, total: 0 },
          latency: 0
        },
        intermediateResults,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        totalLatency: Date.now() - startTime,
        totalTokens
      };
    }
  }

  /**
   * Get statistics about the pipeline steps
   */
  public getStats(): any {
    return {
      steps: this.steps.map(step => ({
        name: step.name,
        model: step.model
      })),
      stepCount: this.steps.length
    };
  }

  /**
   * Clear all steps from the pipeline
   */
  public clearSteps(): void {
    this.steps = [];
    console.log('Pipeline steps cleared');
  }
}
