export const advancedAIConfig = {
  // ChatGPT-5 Level Intelligence Parameters
  intelligence: {
    // Reasoning depth settings
    reasoning: {
      chainOfThought: true,
      metaCognitive: true,
      multiPerspective: true,
      depthLevels: 3
    },
    
    // Response quality parameters
    quality: {
      structureComplexResponses: true,
      anticipateFollowUps: true,
      provideExamples: true,
      crossDomainIntegration: true
    },
    
    // Communication enhancement
    communication: {
      adaptToUserLevel: true,
      useAnalogies: true,
      emphasizeKeyPoints: true,
      providePracticalSteps: true
    }
  },

  // Model-specific optimizations
  modelOptimization: {
    deepseek: {
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      maxTokens: 4000
    },
    
    openrouter: {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 4000
    },
    
    gemini: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 4000
    },
    
    groq: {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 4000
    }
  },

  // Response enhancement templates
  templates: {
    complexAnalysis: {
      structure: [
        "🎯 **Quick Answer**",
        "🔍 **Deep Analysis**", 
        "💡 **Key Insights**",
        "🚀 **Next Steps**"
      ]
    },
    
    problemSolving: {
      structure: [
        "📋 **Understanding the Problem**",
        "🧠 **Strategic Approach**",
        "⚡ **Solution Steps**",
        "🎯 **Expected Outcomes**"
      ]
    },
    
    explanation: {
      structure: [
        "🔑 **Core Concept**",
        "📊 **How It Works**", 
        "🌟 **Real-World Examples**",
        "💭 **Why It Matters**"
      ]
    }
  },

  // Smart response triggers
  triggers: {
    // When to use different response styles
    detailed: [
      "explain", "how does", "what is", "why", "elaborate",
      "tell me more", "in detail", "comprehensive", "thorough"
    ],
    
    practical: [
      "how to", "step by step", "guide", "tutorial", 
      "implement", "create", "build", "solve"
    ],
    
    analytical: [
      "analyze", "compare", "evaluate", "assess",
      "pros and cons", "advantages", "disadvantages"
    ],
    
    creative: [
      "brainstorm", "ideas", "creative", "innovative",
      "alternatives", "suggestions", "possibilities"
    ]
  }
};

export default advancedAIConfig;
