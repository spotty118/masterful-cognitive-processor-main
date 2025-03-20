import { ServiceFactory } from '../../src/factories/ServiceFactory.js';
import { ProcessingPipelineOrchestrator } from '../../src/services/ProcessingPipelineOrchestrator.js';
import dotenv from 'dotenv';
dotenv.config();

async function testMultiModelPipeline() {
  try {
    console.log('Initializing processing pipeline test...');
    
    const pipelineOrchestrator = ServiceFactory.getProcessingPipelineOrchestrator();
    
    const testQuery = "Explain the process of photosynthesis and its importance to life on Earth. Include key chemical reactions and environmental factors.";
    
    console.log('Starting pipeline processing with query:', testQuery);
    console.log('---------------------------------------------------');
    
    const result = await pipelineOrchestrator.process(testQuery);
    
    console.log('Pipeline processing completed successfully!');
    console.log('---------------------------------------------------');
    console.log('Total tokens used:', result.totalTokens);
    console.log('---------------------------------------------------');
    
    console.log('Intermediate Results:');
    result.intermediateResults.forEach((step, index) => {
      console.log(`\nStep ${index + 1}: ${step.metadata.step} (${step.metadata.model})`);
      console.log(`Tokens: ${step.metadata.tokenUsage.total}`);
      console.log('---------------------------------------------------');
      console.log(step.result.substring(0, 150) + '...');
      console.log('---------------------------------------------------');
    });
    
    console.log('\n\nFinal Output:');
    console.log('---------------------------------------------------');
    console.log(result.finalResult);
    console.log('---------------------------------------------------');
    
  } catch (error) {
    console.error('Error testing multi-model pipeline:', error);
  }
}

testMultiModelPipeline();
