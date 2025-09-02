// Test script for Consensus AI Pipeline
// Run this in the browser console to test the implementation

import { multiModelAPI } from './src/services/multiModelAPI.js';

// Test function to verify consensus pipeline
export async function testConsensusAI() {
  console.log('🧠 Testing Consensus AI Pipeline...');
  
  // Test message
  const testMessage = {
    id: 'test-1',
    role: 'user',
    content: 'What is 2 + 2? Explain the mathematical reasoning.',
    timestamp: new Date()
  };
  
  try {
    console.log('📊 Checking system status...');
    const status = multiModelAPI.getStatus();
    console.log('Status:', status);
    
    if (!status.consensusAvailable) {
      console.warn('⚠️ Consensus not available - need at least 2 providers configured');
      return;
    }
    
    console.log('🚀 Starting consensus processing...');
    
    const result = await multiModelAPI.sendMessage(
      [testMessage],
      (chunk) => console.log('Stream chunk:', chunk),
      (step, progress) => console.log(`Progress: ${step} (${progress}%)`)
    );
    
    console.log('✅ Consensus Result:', result);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Used Consensus: ${result.usedConsensus}`);
    
    if (result.consensus) {
      console.log(`Agreement Score: ${result.consensus.agreementScore}`);
      console.log(`Candidates: ${result.consensus.candidates.length}`);
      console.log('Reasoning:', result.consensus.reasoning);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Test cache functionality
export async function testCacheSystem() {
  console.log('🗄️ Testing Cache System...');
  
  const testMessage = {
    id: 'cache-test-1',
    role: 'user', 
    content: 'What is the capital of France?',
    timestamp: new Date()
  };
  
  // First call - should generate new response
  console.log('First call (should generate new response)...');
  const start1 = Date.now();
  const result1 = await multiModelAPI.sendMessage([testMessage]);
  const time1 = Date.now() - start1;
  console.log(`First call took: ${time1}ms`);
  
  // Second call - should use cache
  console.log('Second call (should use cache)...');
  const start2 = Date.now();
  const result2 = await multiModelAPI.sendMessage([testMessage]);
  const time2 = Date.now() - start2;
  console.log(`Second call took: ${time2}ms`);
  
  console.log('Cache performance improvement:', `${((time1 - time2) / time1 * 100).toFixed(1)}%`);
  
  return { result1, result2, time1, time2 };
}

// Test fallback functionality
export async function testFallbackSystem() {
  console.log('🔄 Testing Fallback System...');
  
  // Temporarily disable consensus
  multiModelAPI.setConsensusMode(false);
  
  const testMessage = {
    id: 'fallback-test-1',
    role: 'user',
    content: 'Explain quantum physics in simple terms.',
    timestamp: new Date()
  };
  
  const result = await multiModelAPI.sendMessage([testMessage]);
  
  console.log('Fallback result:', result);
  console.log(`Used Consensus: ${result.usedConsensus} (should be false)`);
  
  // Re-enable consensus
  multiModelAPI.setConsensusMode(true);
  
  return result;
}

// Run all tests
export async function runAllTests() {
  console.log('🧪 Running Comprehensive Consensus AI Tests...\n');
  
  try {
    await testConsensusAI();
    console.log('\n');
    
    await testCacheSystem();
    console.log('\n');
    
    await testFallbackSystem();
    console.log('\n');
    
    console.log('✅ All tests completed successfully!');
    
    // Show final stats
    const stats = multiModelAPI.getConsensusStats();
    console.log('📈 Final Statistics:', stats);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export for browser console usage
window.consensusTests = {
  testConsensusAI,
  testCacheSystem, 
  testFallbackSystem,
  runAllTests,
  getStatus: () => multiModelAPI.getStatus(),
  clearCache: () => multiModelAPI.clearConsensusCache()
};

console.log('🧠 Consensus AI Test Suite loaded!');
console.log('Run window.consensusTests.runAllTests() to start testing');
