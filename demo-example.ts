// Demo Example - Voice AI Golf Caddy
// Complete example showing how to use the voice AI system

import VoiceAISystem from './voice-ai-system';

// Example usage and testing scenarios
class GolfVoiceAIDemo {
  private voiceAI: VoiceAISystem | null = null;

  async initialize(apiKey: string, provider: 'google' | 'azure' = 'google') {
    try {
      this.voiceAI = await VoiceAISystem.createGolfCaddy(apiKey, provider);
      console.log('✅ Voice AI Golf Caddy initialized successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Voice AI:', error);
      return false;
    }
  }

  // Demo: Text-based interaction
  async demoTextInteraction() {
    if (!this.voiceAI) {
      console.log('❌ Voice AI not initialized');
      return;
    }

    console.log('\n🏌️‍♂️ DEMO: Text-based Golf Caddy Interaction');
    console.log('=' .repeat(50));

    // Start session
    const session = await this.voiceAI.startSession();
    console.log(`🤖 AI: ${session.spokenText}`);
    console.log(`📊 State: ${session.state}, Confidence: ${session.confidence}`);

    // User provides shot conditions
    console.log('\n👤 User: "I have 150 yards to the pin, uphill, with 10 mph headwind from the fairway"');
    const response1 = await this.voiceAI.processTextInput("I have 150 yards to the pin, uphill, with 10 mph headwind from the fairway");
    console.log(`🤖 AI: ${response1.spokenText}`);
    console.log(`📊 State: ${response1.state}, Confidence: ${response1.confidence}`);

    // User confirms conditions
    if (response1.needsInput && response1.expectedInput?.includes('yes')) {
      console.log('\n👤 User: "Yes, that\'s correct"');
      const response2 = await this.voiceAI.processTextInput("Yes, that's correct");
      console.log(`🤖 AI: ${response2.spokenText}`);

      if (response2.recommendation) {
        console.log('\n📋 RECOMMENDATION DETAILS:');
        console.log(`🏌️ Primary Club: ${response2.recommendation.primaryClub.name}`);
        console.log(`🎯 Takeback: ${response2.recommendation.primaryClub.takeback}`);
        console.log(`🎪 Face Position: ${response2.recommendation.primaryClub.facePosition}`);
        console.log(`💡 Reason: ${response2.recommendation.primaryClub.reason}`);

        if (response2.recommendation.backupClub) {
          console.log(`🔄 Backup: ${response2.recommendation.backupClub.name}`);
        }

        if (response2.recommendation.aimPoint) {
          console.log(`🎯 Aim: ${response2.recommendation.aimPoint.direction} - ${response2.recommendation.aimPoint.reason}`);
        }

        if (response2.recommendation.stance) {
          console.log(`👟 Stance: ${response2.recommendation.stance.ballPosition} ball position, ${response2.recommendation.stance.weight} weight`);
        }
      }
    }
  }

  // Demo: Different golf scenarios
  async demoGolfScenarios() {
    if (!this.voiceAI) {
      console.log('❌ Voice AI not initialized');
      return;
    }

    console.log('\n🏌️‍♂️ DEMO: Various Golf Scenarios');
    console.log('=' .repeat(50));

    const scenarios = [
      {
        name: 'Short approach shot',
        distance: 75,
        elevation: 'downhill',
        wind: '5 mph tailwind',
        lie: 'fairway',
        temperature: 75
      },
      {
        name: 'Long par 3',
        distance: 180,
        elevation: 'uphill',
        wind: '15 mph headwind',
        lie: 'tee',
        temperature: 60
      },
      {
        name: 'Trouble shot',
        distance: 120,
        wind: '8 mph crosswind',
        lie: 'heavy_rough',
        temperature: 85
      },
      {
        name: 'Greenside shot',
        distance: 40,
        lie: 'sand',
        temperature: 70
      }
    ];

    for (const scenario of scenarios) {
      console.log(`\n🎯 Scenario: ${scenario.name}`);
      console.log(`📏 Distance: ${scenario.distance} yards`);
      console.log(`🌄 Conditions: ${scenario.elevation || 'level'}, ${scenario.wind || 'no wind'}, ${scenario.lie}, ${scenario.temperature}°F`);

      try {
        const response = await this.voiceAI.processGolfScenario(scenario);
        console.log(`🤖 AI Response: ${response.spokenText}`);

        if (response.recommendation) {
          console.log(`🏌️ Recommended Club: ${response.recommendation.primaryClub.name}`);
          console.log(`🎯 Setup: ${response.recommendation.primaryClub.takeback} takeback, ${response.recommendation.primaryClub.facePosition} face`);
        }
      } catch (error) {
        console.log(`❌ Error processing scenario: ${error}`);
      }

      console.log('-' .repeat(30));
    }
  }

  // Demo: Error handling scenarios
  async demoErrorHandling() {
    if (!this.voiceAI) {
      console.log('❌ Voice AI not initialized');
      return;
    }

    console.log('\n🏌️‍♂️ DEMO: Error Handling');
    console.log('=' .repeat(50));

    const errorInputs = [
      {
        name: 'Ambiguous distance',
        input: 'I have 150 no wait 140 actually 160 yards to the pin'
      },
      {
        name: 'Invalid distance',
        input: 'I have 1000 yards to the pin'
      },
      {
        name: 'Conflicting conditions',
        input: 'Its 150 yards uphill and downhill with headwind and tailwind'
      },
      {
        name: 'Missing information',
        input: 'Help me choose a club'
      },
      {
        name: 'Unclear input',
        input: 'Um, like, the thing is over there and its windy maybe'
      }
    ];

    for (const errorInput of errorInputs) {
      console.log(`\n❌ Testing: ${errorInput.name}`);
      console.log(`👤 User Input: "${errorInput.input}"`);

      try {
        const response = await this.voiceAI.processTextInput(errorInput.input);
        console.log(`🤖 AI Response: ${response.spokenText}`);
        console.log(`📊 Confidence: ${response.confidence}`);

        if (response.expectedInput) {
          console.log(`💡 Expected clarification: ${response.expectedInput.join(', ')}`);
        }
      } catch (error) {
        console.log(`❌ Processing error: ${error}`);
      }

      console.log('-' .repeat(30));
    }
  }

  // Demo: Voice recognition simulation
  async demoVoiceRecognitionPatterns() {
    if (!this.voiceAI) {
      console.log('❌ Voice AI not initialized');
      return;
    }

    console.log('\n🏌️‍♂️ DEMO: Voice Recognition Patterns');
    console.log('=' .repeat(50));

    const voicePatterns = [
      // Natural speech patterns
      'uh I have one fifty yards to the pin',
      'its about a hundred and twenty yards uphill',
      'one forty to the flag with ten mile per hour headwind',
      'seventy five yards from the fairway',
      'two hundred yards from the tee box',

      // Common variations
      'one five zero yards out',
      'about 130 to the hole',
      'roughly 95 yards to the stick',
      'I got 165 to the green',
      'maybe 110 yards uphill',

      // With conditions
      'eighty yards downhill into the wind',
      'one sixty with helping wind from light rough',
      'hundred and ten from the sand',
      'ninety five yards over water',
      'two ten from the back tees'
    ];

    for (const pattern of voicePatterns) {
      console.log(`\n🎤 Voice Pattern: "${pattern}"`);

      try {
        const response = await this.voiceAI.processTextInput(pattern);
        console.log(`🤖 Understanding: ${response.spokenText.substring(0, 100)}...`);
        console.log(`📊 Confidence: ${response.confidence.toFixed(2)}`);

        const session = this.voiceAI.getSession();
        if (session.conditions.distance) {
          console.log(`📏 Parsed Distance: ${session.conditions.distance.value} ${session.conditions.distance.unit}`);
        }
        if (session.conditions.wind) {
          console.log(`🌬️ Parsed Wind: ${session.conditions.wind.speed} ${session.conditions.wind.unit} ${session.conditions.wind.direction}`);
        }
        if (session.conditions.elevation) {
          console.log(`🌄 Parsed Elevation: ${session.conditions.elevation.direction}`);
        }
      } catch (error) {
        console.log(`❌ Processing error: ${error}`);
      }

      // Reset for next pattern
      this.voiceAI.resetSession();
      console.log('-' .repeat(20));
    }
  }

  // Demo: Conversation flow
  async demoConversationFlow() {
    if (!this.voiceAI) {
      console.log('❌ Voice AI not initialized');
      return;
    }

    console.log('\n🏌️‍♂️ DEMO: Complete Conversation Flow');
    console.log('=' .repeat(50));

    const conversation = [
      "Hi there",
      "I need help with my next shot",
      "It's 140 yards to the pin",
      "There's a slight uphill",
      "Wind is about 8 mph from the right",
      "I'm on the fairway",
      "Yes that sounds right",
      "What about alternatives?",
      "That works, thank you"
    ];

    // Start session
    let response = await this.voiceAI.startSession();
    console.log(`🤖 AI: ${response.spokenText}`);

    // Process each input in the conversation
    for (let i = 0; i < conversation.length; i++) {
      const userInput = conversation[i];
      console.log(`\n👤 User: "${userInput}"`);

      response = await this.voiceAI.processTextInput(userInput);
      console.log(`🤖 AI: ${response.spokenText}`);
      console.log(`📊 State: ${response.state}, Needs Input: ${response.needsInput}`);

      if (response.recommendation) {
        console.log(`🏌️ Club: ${response.recommendation.primaryClub.name}`);
      }

      // Small delay to simulate real conversation
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ Conversation completed successfully!');
  }

  // Demo: Performance and statistics
  async demoStatistics() {
    if (!this.voiceAI) {
      console.log('❌ Voice AI not initialized');
      return;
    }

    console.log('\n🏌️‍♂️ DEMO: System Statistics');
    console.log('=' .repeat(50));

    const stats = this.voiceAI.getStatistics();

    console.log('📊 SESSION INFO:');
    console.log(`Session ID: ${stats.sessionInfo.id}`);
    console.log(`Start Time: ${stats.sessionInfo.startTime.toLocaleString()}`);
    console.log(`Current State: ${stats.sessionInfo.state}`);
    console.log(`Attempt Count: ${stats.sessionInfo.attemptCount}`);

    console.log('\n🔧 SPEECH CONFIG:');
    console.log(`Provider: ${stats.speechConfig.provider}`);
    console.log(`Language: ${stats.speechConfig.language}`);
    console.log(`Sample Rate: ${stats.speechConfig.sampleRate}Hz`);

    console.log('\n⚠️ ERROR STATISTICS:');
    console.log(`Total Errors: ${stats.errorStats.totalErrors}`);
    console.log(`Success Rate: ${(stats.errorStats.successRate * 100).toFixed(1)}%`);
    console.log(`Common Patterns: ${stats.errorStats.commonPatterns.join(', ')}`);
  }

  // Run all demos
  async runAllDemos(apiKey: string, provider: 'google' | 'azure' = 'google') {
    console.log('🏌️‍♂️ GOLF VOICE AI COMPREHENSIVE DEMO');
    console.log('=' .repeat(60));

    const initialized = await this.initialize(apiKey, provider);
    if (!initialized) {
      console.log('❌ Cannot run demos without proper initialization');
      return;
    }

    try {
      await this.demoTextInteraction();
      await this.demoGolfScenarios();
      await this.demoErrorHandling();
      await this.demoVoiceRecognitionPatterns();
      await this.demoConversationFlow();
      await this.demoStatistics();

      console.log('\n🎉 ALL DEMOS COMPLETED SUCCESSFULLY!');
    } catch (error) {
      console.error('❌ Demo error:', error);
    }
  }
}

// Usage example
async function runDemo() {
  const demo = new GolfVoiceAIDemo();

  // Replace with your actual API key
  const API_KEY = 'your_google_or_azure_api_key_here';
  const PROVIDER = 'google'; // or 'azure'

  await demo.runAllDemos(API_KEY, PROVIDER);
}

// Export for use in other files
export default GolfVoiceAIDemo;

// If running directly, execute demo
if (require.main === module) {
  runDemo().catch(console.error);
}

/*
EXAMPLE USAGE IN A WEB APPLICATION:

import VoiceAISystem from './voice-ai-system';

class GolfApp {
  private voiceAI: VoiceAISystem;

  async init() {
    this.voiceAI = await VoiceAISystem.createGolfCaddy('your-api-key', 'google');
  }

  async handleVoiceInput() {
    // Record audio from microphone
    const response = await this.voiceAI.recordAndProcess(5000);

    // Play the AI response
    await this.voiceAI.playResponse(response);

    // Display recommendation in UI
    if (response.recommendation) {
      this.displayRecommendation(response.recommendation);
    }
  }

  async handleTextInput(userText: string) {
    const response = await this.voiceAI.processTextInput(userText);
    this.displayResponse(response);
  }
}

INTEGRATION WITH REACT:

function GolfCaddy() {
  const [voiceAI, setVoiceAI] = useState<VoiceAISystem | null>(null);
  const [response, setResponse] = useState<string>('');
  const [recommendation, setRecommendation] = useState<ClubRecommendation | null>(null);

  useEffect(() => {
    VoiceAISystem.createGolfCaddy('your-api-key').then(setVoiceAI);
  }, []);

  const handleVoiceInput = async () => {
    if (!voiceAI) return;

    const result = await voiceAI.recordAndProcess();
    setResponse(result.spokenText);
    setRecommendation(result.recommendation || null);

    if (result.audioData) {
      await SpeechManager.playAudio(result.audioData, 'MP3');
    }
  };

  return (
    <div>
      <button onClick={handleVoiceInput}>🎤 Ask for Club Recommendation</button>
      <div>{response}</div>
      {recommendation && <ClubRecommendationDisplay rec={recommendation} />}
    </div>
  );
}
*/