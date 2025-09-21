/**
 * CaddyAI Voice Input Testing Framework
 * Tests voice recognition accuracy across various conditions
 */

const { VoiceTestRunner } = require('./VoiceTestRunner');
const { voiceTestScenarios } = require('./fixtures/voiceTestScenarios');

describe('CaddyAI Voice Input Tests', () => {
  let voiceTestRunner;

  beforeAll(async () => {
    voiceTestRunner = new VoiceTestRunner();
    await voiceTestRunner.initialize();
  });

  afterAll(async () => {
    await voiceTestRunner.cleanup();
  });

  describe('Command Recognition Accuracy', () => {
    test('should recognize distance requests accurately', async () => {
      const distanceCommands = voiceTestScenarios.distanceCommands;

      for (const command of distanceCommands) {
        const result = await voiceTestRunner.testCommand(command);

        expect(result.recognized).toBe(true);
        expect(result.intent).toBe('distance_request');
        expect(result.confidence).toBeGreaterThan(0.8);
        expect(result.processingTime).toBeLessThan(2000); // <2 seconds
      }
    });

    test('should recognize club recommendation requests', async () => {
      const clubCommands = voiceTestScenarios.clubCommands;

      for (const command of clubCommands) {
        const result = await voiceTestRunner.testCommand(command);

        expect(result.recognized).toBe(true);
        expect(result.intent).toBe('club_recommendation');
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });

    test('should recognize weather/wind requests', async () => {
      const weatherCommands = voiceTestScenarios.weatherCommands;

      for (const command of weatherCommands) {
        const result = await voiceTestRunner.testCommand(command);

        expect(result.recognized).toBe(true);
        expect(result.intent).toBe('weather_request');
        expect(result.confidence).toBeGreaterThan(0.75);
      }
    });

    test('should recognize course information requests', async () => {
      const courseCommands = voiceTestScenarios.courseCommands;

      for (const command of courseCommands) {
        const result = await voiceTestRunner.testCommand(command);

        expect(result.recognized).toBe(true);
        expect(result.intent).toBe('course_info');
        expect(result.confidence).toBeGreaterThan(0.75);
      }
    });
  });

  describe('Accent and Dialect Variations', () => {
    test('should handle American English variations', async () => {
      const americanAccents = voiceTestScenarios.accents.american;

      for (const accent of americanAccents) {
        const results = await voiceTestRunner.testAccent(accent);
        const successRate = results.filter(r => r.recognized).length / results.length;

        expect(successRate).toBeGreaterThan(0.90); // 90% success rate
      }
    });

    test('should handle British English', async () => {
      const britishAccents = voiceTestScenarios.accents.british;

      for (const accent of britishAccents) {
        const results = await voiceTestRunner.testAccent(accent);
        const successRate = results.filter(r => r.recognized).length / results.length;

        expect(successRate).toBeGreaterThan(0.85); // 85% success rate
      }
    });

    test('should handle non-native English speakers', async () => {
      const nonNativeAccents = voiceTestScenarios.accents.nonNative;

      for (const accent of nonNativeAccents) {
        const results = await voiceTestRunner.testAccent(accent);
        const successRate = results.filter(r => r.recognized).length / results.length;

        expect(successRate).toBeGreaterThan(0.75); // 75% success rate
      }
    });
  });

  describe('Environmental Noise Testing', () => {
    test('should handle quiet indoor environments', async () => {
      const results = await voiceTestRunner.testWithNoise('quiet_indoor',
        voiceTestScenarios.standardCommands);

      const successRate = results.filter(r => r.recognized).length / results.length;
      expect(successRate).toBeGreaterThan(0.95); // 95% in quiet conditions
    });

    test('should handle outdoor wind noise', async () => {
      const results = await voiceTestRunner.testWithNoise('wind_noise',
        voiceTestScenarios.standardCommands);

      const successRate = results.filter(r => r.recognized).length / results.length;
      expect(successRate).toBeGreaterThan(0.80); // 80% with wind noise
    });

    test('should handle golf cart engine noise', async () => {
      const results = await voiceTestRunner.testWithNoise('cart_noise',
        voiceTestScenarios.standardCommands);

      const successRate = results.filter(r => r.recognized).length / results.length;
      expect(successRate).toBeGreaterThan(0.75); // 75% with cart noise
    });

    test('should handle conversation background noise', async () => {
      const results = await voiceTestRunner.testWithNoise('conversation_noise',
        voiceTestScenarios.standardCommands);

      const successRate = results.filter(r => r.recognized).length / results.length;
      expect(successRate).toBeGreaterThan(0.70); // 70% with conversation
    });
  });

  describe('Speech Pattern Variations', () => {
    test('should handle fast speech', async () => {
      const results = await voiceTestRunner.testWithSpeechRate('fast',
        voiceTestScenarios.standardCommands);

      const successRate = results.filter(r => r.recognized).length / results.length;
      expect(successRate).toBeGreaterThan(0.85); // 85% for fast speech
    });

    test('should handle slow/deliberate speech', async () => {
      const results = await voiceTestRunner.testWithSpeechRate('slow',
        voiceTestScenarios.standardCommands);

      const successRate = results.filter(r => r.recognized).length / results.length;
      expect(successRate).toBeGreaterThan(0.90); // 90% for slow speech
    });

    test('should handle interrupted speech patterns', async () => {
      const interruptedCommands = voiceTestScenarios.interruptedCommands;

      for (const command of interruptedCommands) {
        const result = await voiceTestRunner.testCommand(command);

        // Should either recognize correctly or request clarification
        expect(result.recognized || result.needsClarification).toBe(true);
      }
    });

    test('should handle partial/incomplete commands', async () => {
      const partialCommands = voiceTestScenarios.partialCommands;

      for (const command of partialCommands) {
        const result = await voiceTestRunner.testCommand(command);

        // Should request more information
        expect(result.needsMoreInfo).toBe(true);
        expect(result.clarificationPrompt).toBeDefined();
      }
    });
  });

  describe('Context Understanding', () => {
    test('should maintain context across multiple commands', async () => {
      const conversationFlow = voiceTestScenarios.conversationFlows.basic;

      const contextResults = await voiceTestRunner.testConversationFlow(conversationFlow);

      // Each command should be understood in context
      contextResults.forEach((result, index) => {
        expect(result.recognized).toBe(true);
        if (index > 0) {
          expect(result.usedContext).toBe(true);
        }
      });
    });

    test('should handle pronoun references correctly', async () => {
      const pronounCommands = voiceTestScenarios.pronounReferences;

      for (const sequence of pronounCommands) {
        const results = await voiceTestRunner.testCommandSequence(sequence);

        // Should resolve pronouns correctly
        expect(results.every(r => r.pronounResolved)).toBe(true);
      }
    });
  });

  describe('Error Recovery', () => {
    test('should handle unrecognized commands gracefully', async () => {
      const gibberishCommands = voiceTestScenarios.gibberish;

      for (const command of gibberishCommands) {
        const result = await voiceTestRunner.testCommand(command);

        expect(result.recognized).toBe(false);
        expect(result.errorHandled).toBe(true);
        expect(result.helpOffered).toBe(true);
      }
    });

    test('should request clarification for ambiguous commands', async () => {
      const ambiguousCommands = voiceTestScenarios.ambiguousCommands;

      for (const command of ambiguousCommands) {
        const result = await voiceTestRunner.testCommand(command);

        expect(result.needsClarification).toBe(true);
        expect(result.clarificationOptions).toBeDefined();
      }
    });

    test('should handle very quiet speech', async () => {
      const results = await voiceTestRunner.testWithVolume('very_quiet',
        voiceTestScenarios.standardCommands);

      results.forEach(result => {
        if (!result.recognized) {
          expect(result.requestedRepeat).toBe(true);
        }
      });
    });
  });

  describe('Performance Benchmarks', () => {
    test('should process commands within time limits', async () => {
      const performanceTests = voiceTestScenarios.performanceTests;

      for (const test of performanceTests) {
        const startTime = Date.now();
        const result = await voiceTestRunner.testCommand(test.command);
        const endTime = Date.now();

        const processingTime = endTime - startTime;
        expect(processingTime).toBeLessThan(test.maxTime);
      }
    });

    test('should maintain accuracy under load', async () => {
      const loadTest = await voiceTestRunner.runLoadTest(
        voiceTestScenarios.standardCommands,
        { concurrent: 5, iterations: 20 }
      );

      expect(loadTest.overallSuccessRate).toBeGreaterThan(0.90);
      expect(loadTest.averageResponseTime).toBeLessThan(2500);
    });
  });

  describe('Integration with Golf Logic', () => {
    test('should correctly parse distance values from speech', async () => {
      const distanceExtractionTests = voiceTestScenarios.distanceExtraction;

      for (const test of distanceExtractionTests) {
        const result = await voiceTestRunner.testCommand(test.command);

        expect(result.extractedDistance).toBe(test.expectedDistance);
      }
    });

    test('should correctly parse club names from speech', async () => {
      const clubExtractionTests = voiceTestScenarios.clubExtraction;

      for (const test of clubExtractionTests) {
        const result = await voiceTestRunner.testCommand(test.command);

        expect(result.extractedClub).toBe(test.expectedClub);
      }
    });

    test('should integrate with calculation engine', async () => {
      const integrationTests = voiceTestScenarios.integrationTests;

      for (const test of integrationTests) {
        const result = await voiceTestRunner.testIntegratedCommand(test);

        expect(result.voiceRecognized).toBe(true);
        expect(result.calculationTriggered).toBe(true);
        expect(result.responseDelivered).toBe(true);
      }
    });
  });

  describe('Accessibility Features', () => {
    test('should provide audio feedback for successful recognition', async () => {
      const command = voiceTestScenarios.standardCommands[0];
      const result = await voiceTestRunner.testCommand(command, { audioFeedback: true });

      expect(result.audioConfirmation).toBe(true);
    });

    test('should handle speech impediments gracefully', async () => {
      const impedimentTests = voiceTestScenarios.speechImpediments;

      for (const test of impedimentTests) {
        const result = await voiceTestRunner.testCommand(test.command);

        // Should still attempt recognition or offer alternatives
        expect(result.recognized || result.alternativeOffered).toBe(true);
      }
    });
  });

  describe('Multi-language Support Preparation', () => {
    test('should handle English with foreign golf terms', async () => {
      const foreignTerms = voiceTestScenarios.foreignGolfTerms;

      for (const term of foreignTerms) {
        const result = await voiceTestRunner.testCommand(term.command);

        expect(result.recognized).toBe(true);
        expect(result.translatedTerm).toBe(term.expectedTranslation);
      }
    });
  });
});