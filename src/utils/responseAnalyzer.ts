/**
 * Utility functions for analyzing user input and determining response style
 */

export class ResponseAnalyzer {
  // Keywords that indicate user wants elaboration
  private static elaborationKeywords = [
    'elaborate', 'explain more', 'tell me more', 'expand', 'detail', 'in depth',
    'more info', 'explain better', 'go deeper', 'more details', 'can you explain',
    'give me more', 'elaborate on', 'expand on', 'tell me about', 'describe',
    'break down', 'walk me through', 'help me understand', 'clarify',
    'what exactly', 'how specifically', 'why exactly', 'what are the details',
    'comprehensive', 'thorough', 'complete explanation', 'full details'
  ];

  // Keywords that indicate user wants brief response
  private static briefKeywords = [
    'briefly', 'quick', 'short', 'summary', 'summarize', 'tldr', 'tl;dr',
    'in short', 'simple answer', 'just tell me', 'quick answer',
    'one word', 'yes or no', 'simple', 'concise', 'bullet points'
  ];

  // Question types that typically need more detailed responses
  private static complexQuestionPatterns = [
    /how does .* work/i,
    /what is the difference between/i,
    /compare .* and/i,
    /what are the .* of/i,
    /explain the process/i,
    /walk me through/i,
    /what should i know about/i,
    /pros and cons/i,
    /advantages and disadvantages/i
  ];

  /**
   * Analyze user message to determine if they want elaboration
   */
  static wantsElaboration(message: string, previousMessages: string[] = []): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Check for explicit elaboration requests
    const hasElaborationKeywords = this.elaborationKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    // Check for brief request keywords (override elaboration)
    const hasBriefKeywords = this.briefKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    // If explicitly asking for brief, return false
    if (hasBriefKeywords) return false;
    
    // If explicitly asking for elaboration, return true
    if (hasElaborationKeywords) return true;
    
    // Check for complex question patterns that naturally need detailed responses
    const isComplexQuestion = this.complexQuestionPatterns.some(pattern => 
      pattern.test(message)
    );
    
    // Check if this is a follow-up question that might need elaboration
    const isFollowUp = previousMessages.length > 0 && (
      lowerMessage.startsWith('what about') ||
      lowerMessage.startsWith('how about') ||
      lowerMessage.startsWith('and what') ||
      lowerMessage.includes('also') ||
      lowerMessage.includes('furthermore') ||
      lowerMessage.includes('additionally')
    );
    
    return isComplexQuestion || isFollowUp;
  }

  /**
   * Determine the appropriate response length based on question type
   */
  static getResponseStyle(message: string, previousMessages: string[] = []): 'brief' | 'standard' | 'detailed' {
    const lowerMessage = message.toLowerCase();
    
    // Check for explicit length requests
    if (this.briefKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
      return 'brief';
    }
    
    if (this.wantsElaboration(message, previousMessages)) {
      return 'detailed';
    }
    
    // Default to standard informative response
    return 'standard';
  }

  /**
   * Generate dynamic system prompt based on response style
   */
  static generateResponseInstructions(style: 'brief' | 'standard' | 'detailed'): string {
    switch (style) {
      case 'brief':
        return `
📋 BRIEF MODE:
- Provide concise, direct answers (1-2 sentences)
- Focus only on the essential information
- Use bullet points for multiple items
- Be precise and to the point`;

      case 'detailed':
        return `
🔍 DETAILED MODE:
- Provide comprehensive, thorough explanations
- Include examples, context, and background information
- Break down complex topics into clear sections
- Add practical applications and real-world examples
- Use structured formatting (bullet points, numbered lists)
- Explain the "why" behind concepts`;

      case 'standard':
      default:
        return `
📝 STANDARD MODE:
- Provide informative, well-rounded responses (2-4 sentences)
- Include key details and relevant context
- Give practical, actionable information
- Structure clearly with main points
- Balance completeness with readability`;
    }
  }
}
