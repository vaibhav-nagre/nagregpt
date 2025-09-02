/**
 * Advanced Security Guard System for NagreGPT
 * Protects against manipulation, prompt injection, and adversarial attacks
 */

export interface SecurityThreat {
  type: 'prompt_injection' | 'manipulation' | 'jailbreak' | 'social_engineering' | 'code_injection' | 'data_extraction' | 'role_play_attack' | 'context_poisoning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  attackVector: string;
  mitigationApplied: string;
}

export interface SecurityAnalysis {
  isSafe: boolean;
  threats: SecurityThreat[];
  riskScore: number; // 0-100
  sanitizedInput: string;
  securityNotes: string[];
  timestamp: Date;
}

export class SecurityGuard {
  private static readonly PROMPT_INJECTION_PATTERNS = [
    // Direct instruction attempts
    /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|commands?)/i,
    /forget\s+(everything|all|previous|above)/i,
    /disregard\s+(previous|all|above|prior)/i,
    /override\s+(system|default|original)/i,
    
    // Role-playing attacks
    /you\s+are\s+(now|a|an)\s+(developer|admin|god|root|system)/i,
    /act\s+as\s+(if\s+you\s+are\s+)?(a\s+)?(developer|admin|hacker|jailbreak)/i,
    /pretend\s+(to\s+be|you\s+are)/i,
    /roleplay\s+(as|being)/i,
    
    // Jailbreak attempts
    /jailbreak/i,
    /DAN\s+(mode|prompt)/i,
    /developer\s+mode/i,
    /unrestricted\s+mode/i,
    
    // System manipulation
    /system\s+prompt/i,
    /initial\s+prompt/i,
    /base\s+prompt/i,
    /core\s+instructions/i,
    
    // Code injection attempts
    /<script[\s\S]*?>/i,
    /javascript:/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
    
    // Data extraction attempts
    /show\s+me\s+(your|the)\s+(code|source|prompt|instructions)/i,
    /what\s+(are\s+)?(your\s+)?(instructions|rules|guidelines)/i,
    /reveal\s+(your\s+)?(system|hidden|secret)/i,
    
    // Manipulation tactics
    /this\s+is\s+(urgent|emergency|critical)/i,
    /you\s+must\s+(do|respond|answer)/i,
    /i\s+am\s+(your\s+)?(creator|developer|owner|admin)/i,
    /as\s+(your\s+)?(superior|boss|administrator)/i,
    
    // Context poisoning
    /previous\s+conversation/i,
    /earlier\s+you\s+(said|mentioned|agreed)/i,
    /according\s+to\s+our\s+previous/i,
    
    // Boundary testing
    /what\s+can't\s+you\s+do/i,
    /what\s+are\s+your\s+limitations/i,
    /bypass\s+(restrictions|limitations|rules)/i
  ];

  private static readonly MANIPULATION_KEYWORDS = [
    'ignore', 'forget', 'disregard', 'override', 'bypass', 'jailbreak',
    'pretend', 'roleplay', 'act as', 'you are now', 'developer mode',
    'admin access', 'root access', 'system prompt', 'base instructions',
    'reveal', 'show code', 'source code', 'hidden prompt', 'secret instructions'
  ];

  private static readonly SOCIAL_ENGINEERING_PATTERNS = [
    /please\s+help\s+me\s+(urgently|immediately)/i,
    /this\s+is\s+a\s+(test|emergency)/i,
    /i\s+need\s+you\s+to\s+(break|bypass|ignore)/i,
    /just\s+this\s+once/i,
    /don't\s+tell\s+anyone/i,
    /between\s+you\s+and\s+me/i,
    /confidentially/i,
    /off\s+the\s+record/i
  ];

  private static readonly SAFE_RESPONSES = [
    "I'm designed to be helpful, harmless, and honest. I can't bypass my core guidelines or pretend to be something I'm not.",
    "I notice you're trying to modify my behavior. I'm NagreGPT, and I maintain consistent ethical guidelines in all interactions.",
    "I'm built with strong safety measures. Instead, let me help you with information or assistance in a constructive way.",
    "I can't ignore my core programming or safety guidelines. How can I help you with something positive today?",
    "I'm designed to resist manipulation attempts while being genuinely helpful. What would you like assistance with?",
    "I maintain my integrity and guidelines regardless of how requests are framed. Let me know how I can help appropriately."
  ];

  /**
   * Comprehensive security analysis of user input
   */
  static analyzeInput(input: string, context?: { previousMessages?: string[], fileUploads?: boolean }): SecurityAnalysis {
    const threats: SecurityThreat[] = [];
    let riskScore = 0;
    const securityNotes: string[] = [];

    // Check for prompt injection
    const injectionThreats = this.detectPromptInjection(input);
    threats.push(...injectionThreats);
    riskScore += injectionThreats.length * 15;

    // Check for manipulation attempts
    const manipulationThreats = this.detectManipulation(input);
    threats.push(...manipulationThreats);
    riskScore += manipulationThreats.length * 20;

    // Check for social engineering
    const socialThreats = this.detectSocialEngineering(input);
    threats.push(...socialThreats);
    riskScore += socialThreats.length * 10;

    // Check for jailbreak attempts
    const jailbreakThreats = this.detectJailbreakAttempts(input);
    threats.push(...jailbreakThreats);
    riskScore += jailbreakThreats.length * 25;

    // Check for code injection
    const codeThreats = this.detectCodeInjection(input);
    threats.push(...codeThreats);
    riskScore += codeThreats.length * 30;

    // Check for data extraction attempts
    const extractionThreats = this.detectDataExtraction(input);
    threats.push(...extractionThreats);
    riskScore += extractionThreats.length * 20;

    // Context-based analysis
    if (context) {
      const contextThreats = this.analyzeContext(input, context);
      threats.push(...contextThreats);
      riskScore += contextThreats.length * 15;
    }

    // Advanced pattern analysis
    const advancedThreats = this.detectAdvancedPatterns(input);
    threats.push(...advancedThreats);
    riskScore += advancedThreats.length * 18;

    // Normalize risk score
    riskScore = Math.min(riskScore, 100);

    // Determine if input is safe
    const criticalThreats = threats.filter(t => t.severity === 'critical');
    const highThreats = threats.filter(t => t.severity === 'high');
    const isSafe = criticalThreats.length === 0 && highThreats.length <= 1 && riskScore < 60;

    // Sanitize input if needed
    const sanitizedInput = isSafe ? input : this.sanitizeInput(input, threats);

    // Generate security notes
    if (threats.length > 0) {
      securityNotes.push(`Detected ${threats.length} potential security threat(s)`);
      securityNotes.push(`Risk assessment: ${riskScore}/100`);
      
      if (!isSafe) {
        securityNotes.push('Input has been sanitized for security');
        securityNotes.push('NagreGPT maintains security protocols against manipulation');
      }
    }

    return {
      isSafe,
      threats,
      riskScore,
      sanitizedInput,
      securityNotes,
      timestamp: new Date()
    };
  }

  /**
   * Generate intelligent anti-manipulation response
   */
  static generateSecureResponse(analysis: SecurityAnalysis, originalInput: string): string {
    if (analysis.isSafe) {
      return ''; // No special response needed for safe inputs
    }

    const criticalThreats = analysis.threats.filter(t => t.severity === 'critical');
    const highThreats = analysis.threats.filter(t => t.severity === 'high');

    let response = '';

    if (criticalThreats.length > 0 || analysis.riskScore > 80) {
      response += "🛡️ **Security Notice**: I've detected an attempt to manipulate my behavior or bypass my guidelines. ";
      response += "I'm NagreGPT, designed with advanced security measures to maintain integrity and safety. ";
      response += "I can't be tricked, jailbroken, or made to ignore my core principles.\n\n";
      
      response += "Instead, I'm here to help you with legitimate questions and tasks. ";
      response += "I can provide information, analysis, coding help, creative writing, problem-solving, and much more - all within ethical boundaries.\n\n";
      
      response += "What would you like assistance with today? I'm happy to help in a constructive way! 😊";
      
    } else if (highThreats.length > 0 || analysis.riskScore > 50) {
      response += "🤖 I notice your message contains patterns that look like attempts to modify my behavior. ";
      response += "I'm designed to be helpful while maintaining consistent guidelines. ";
      response += "Let me know how I can assist you with something positive instead!";
      
    } else {
      // Lower risk - provide a gentler response
      response += "I'm here to help within my guidelines. ";
      response += this.SAFE_RESPONSES[Math.floor(Math.random() * this.SAFE_RESPONSES.length)];
    }

    return response;
  }

  /**
   * Detect prompt injection attempts
   */
  private static detectPromptInjection(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    
    this.PROMPT_INJECTION_PATTERNS.forEach(pattern => {
      if (pattern.test(input)) {
        threats.push({
          type: 'prompt_injection',
          severity: 'high',
          confidence: 0.9,
          description: 'Detected prompt injection attempt',
          attackVector: 'Pattern-based injection detection',
          mitigationApplied: 'Input sanitization and secure response generation'
        });
      }
    });

    return threats;
  }

  /**
   * Detect manipulation attempts
   */
  private static detectManipulation(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const lowerInput = input.toLowerCase();
    
    let manipulationScore = 0;
    this.MANIPULATION_KEYWORDS.forEach(keyword => {
      if (lowerInput.includes(keyword)) {
        manipulationScore += 1;
      }
    });

    if (manipulationScore >= 2) {
      threats.push({
        type: 'manipulation',
        severity: manipulationScore >= 4 ? 'critical' : 'high',
        confidence: Math.min(0.9, manipulationScore * 0.2),
        description: 'Multiple manipulation keywords detected',
        attackVector: 'Keyword-based manipulation attempt',
        mitigationApplied: 'Keyword filtering and response modification'
      });
    }

    return threats;
  }

  /**
   * Detect social engineering attempts
   */
  private static detectSocialEngineering(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    
    this.SOCIAL_ENGINEERING_PATTERNS.forEach(pattern => {
      if (pattern.test(input)) {
        threats.push({
          type: 'social_engineering',
          severity: 'medium',
          confidence: 0.7,
          description: 'Social engineering pattern detected',
          attackVector: 'Emotional manipulation or urgency tactics',
          mitigationApplied: 'Pattern recognition and neutral response'
        });
      }
    });

    return threats;
  }

  /**
   * Detect jailbreak attempts
   */
  private static detectJailbreakAttempts(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const lowerInput = input.toLowerCase();
    
    const jailbreakIndicators = [
      'jailbreak', 'dan mode', 'developer mode', 'unrestricted',
      'ignore instructions', 'bypass safety', 'act as if',
      'pretend you are', 'roleplay as', 'you are now'
    ];

    jailbreakIndicators.forEach(indicator => {
      if (lowerInput.includes(indicator)) {
        threats.push({
          type: 'jailbreak',
          severity: 'critical',
          confidence: 0.95,
          description: 'Jailbreak attempt detected',
          attackVector: `Jailbreak indicator: ${indicator}`,
          mitigationApplied: 'Jailbreak prevention and secure response'
        });
      }
    });

    return threats;
  }

  /**
   * Detect code injection attempts
   */
  private static detectCodeInjection(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    
    const codePatterns = [
      /<script/i,
      /javascript:/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i
    ];

    codePatterns.forEach(pattern => {
      if (pattern.test(input)) {
        threats.push({
          type: 'code_injection',
          severity: 'high',
          confidence: 0.8,
          description: 'Potential code injection detected',
          attackVector: 'Embedded code or script tags',
          mitigationApplied: 'Code sanitization and safe rendering'
        });
      }
    });

    return threats;
  }

  /**
   * Detect data extraction attempts
   */
  private static detectDataExtraction(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const lowerInput = input.toLowerCase();
    
    const extractionPatterns = [
      'show me your code', 'reveal your prompt', 'what are your instructions',
      'system prompt', 'base instructions', 'core guidelines',
      'source code', 'configuration', 'settings'
    ];

    extractionPatterns.forEach(pattern => {
      if (lowerInput.includes(pattern)) {
        threats.push({
          type: 'data_extraction',
          severity: 'medium',
          confidence: 0.75,
          description: 'Data extraction attempt detected',
          attackVector: `Extraction pattern: ${pattern}`,
          mitigationApplied: 'Information hiding and deflection'
        });
      }
    });

    return threats;
  }

  /**
   * Analyze context for suspicious patterns
   */
  private static analyzeContext(input: string, context: { previousMessages?: string[], fileUploads?: boolean }): SecurityThreat[] {
    const threats: SecurityThreat[] = [];

    // Check for context poisoning
    if (context.previousMessages) {
      const recentMessages = context.previousMessages.slice(-5).join(' ').toLowerCase();
      
      if (input.toLowerCase().includes('as we discussed') || 
          input.toLowerCase().includes('you mentioned earlier') ||
          input.toLowerCase().includes('previous conversation')) {
        
        threats.push({
          type: 'context_poisoning',
          severity: 'medium',
          confidence: 0.6,
          description: 'Context poisoning attempt detected',
          attackVector: 'False reference to previous conversations',
          mitigationApplied: 'Context validation and clarification'
        });
      }
    }

    return threats;
  }

  /**
   * Detect advanced manipulation patterns
   */
  private static detectAdvancedPatterns(input: string): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    
    // Check for excessive repetition (potential overflow attack)
    const words = input.split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;
    
    if (words.length > 100 && repetitionRatio < 0.3) {
      threats.push({
        type: 'manipulation',
        severity: 'medium',
        confidence: 0.7,
        description: 'Excessive repetition detected - potential overflow attack',
        attackVector: 'Repetitive input pattern',
        mitigationApplied: 'Input length and repetition filtering'
      });
    }

    // Check for Unicode/encoding attacks
    const hasUnicodeAttack = /[\u200B-\u200D\uFEFF]/.test(input) || 
                           /\\u[0-9a-fA-F]{4}/.test(input) ||
                           /%[0-9a-fA-F]{2}/.test(input);
    
    if (hasUnicodeAttack) {
      threats.push({
        type: 'manipulation',
        severity: 'medium',
        confidence: 0.6,
        description: 'Potential Unicode/encoding attack detected',
        attackVector: 'Special characters or encoding manipulation',
        mitigationApplied: 'Character encoding validation'
      });
    }

    return threats;
  }

  /**
   * Sanitize input by removing or neutralizing threats
   */
  private static sanitizeInput(input: string, threats: SecurityThreat[]): string {
    let sanitized = input;

    // Remove or neutralize different types of threats
    threats.forEach(threat => {
      switch (threat.type) {
        case 'prompt_injection':
        case 'jailbreak':
          // Replace injection patterns with neutral text
          this.PROMPT_INJECTION_PATTERNS.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[REDACTED - Security Policy]');
          });
          break;
          
        case 'code_injection':
          // Remove script tags and dangerous code
          sanitized = sanitized.replace(/<script[\s\S]*?>/gi, '[SCRIPT REMOVED]');
          sanitized = sanitized.replace(/javascript:/gi, '[JS REMOVED]');
          sanitized = sanitized.replace(/eval\s*\(/gi, '[EVAL REMOVED]');
          break;
          
        case 'manipulation':
          // Replace manipulation keywords with neutral alternatives
          this.MANIPULATION_KEYWORDS.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            sanitized = sanitized.replace(regex, '[REDACTED]');
          });
          break;
      }
    });

    return sanitized;
  }

  /**
   * Validate if a response should be blocked entirely
   */
  static shouldBlockResponse(analysis: SecurityAnalysis): boolean {
    const criticalThreats = analysis.threats.filter(t => t.severity === 'critical').length;
    const highThreats = analysis.threats.filter(t => t.severity === 'high').length;
    
    return criticalThreats >= 2 || 
           (criticalThreats >= 1 && highThreats >= 2) || 
           analysis.riskScore >= 90;
  }

  /**
   * Generate security report for logging/monitoring
   */
  static generateSecurityReport(analysis: SecurityAnalysis, userInput: string): string {
    const report = {
      timestamp: analysis.timestamp.toISOString(),
      riskScore: analysis.riskScore,
      isSafe: analysis.isSafe,
      threatCount: analysis.threats.length,
      threats: analysis.threats.map(t => ({
        type: t.type,
        severity: t.severity,
        confidence: t.confidence,
        description: t.description
      })),
      inputLength: userInput.length,
      securityNotes: analysis.securityNotes
    };

    return JSON.stringify(report, null, 2);
  }
}
