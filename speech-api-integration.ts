// Speech API Integration
// Integrates with Google Speech-to-Text/Text-to-Speech and Azure Cognitive Services

export interface SpeechConfig {
  provider: 'google' | 'azure';
  apiKey: string;
  region?: string;
  language: string;
  sampleRate: number;
  enableProfanityFilter: boolean;
  enableAutomaticPunctuation: boolean;
  enableWordTimeOffsets: boolean;
}

export interface RecognitionResult {
  transcript: string;
  confidence: number;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
  wordTimings?: Array<{
    word: string;
    startTime: number;
    endTime: number;
  }>;
  isFinal: boolean;
}

export interface SynthesisResult {
  audioData: ArrayBuffer;
  duration: number;
  format: string;
}

export interface SpeechProvider {
  recognize(audioData: ArrayBuffer): Promise<RecognitionResult>;
  synthesize(text: string, options?: SynthesisOptions): Promise<SynthesisResult>;
  startStreaming(): Promise<void>;
  stopStreaming(): Promise<void>;
  isStreaming(): boolean;
}

export interface SynthesisOptions {
  voice?: string;
  speakingRate?: number;
  pitch?: number;
  volumeGain?: number;
  audioEncoding?: 'MP3' | 'WAV' | 'OGG';
}

export class GoogleSpeechProvider implements SpeechProvider {
  private config: SpeechConfig;
  private streamingClient: any = null;
  private isStreamingActive = false;

  constructor(config: SpeechConfig) {
    this.config = config;
  }

  async recognize(audioData: ArrayBuffer): Promise<RecognitionResult> {
    try {
      const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: this.config.sampleRate,
            languageCode: this.config.language,
            enableAutomaticPunctuation: this.config.enableAutomaticPunctuation,
            enableWordTimeOffsets: this.config.enableWordTimeOffsets,
            profanityFilter: this.config.enableProfanityFilter,
            // Golf-specific model improvements
            speechContexts: [
              {
                phrases: [
                  'yards', 'feet', 'pin', 'hole', 'green', 'flag',
                  'uphill', 'downhill', 'headwind', 'tailwind', 'crosswind',
                  'fairway', 'rough', 'sand', 'bunker', 'tee',
                  'driver', 'iron', 'wedge', 'wood', 'hybrid', 'putter'
                ],
                boost: 10.0
              }
            ],
            // Enhanced recognition for numbers
            useEnhanced: true,
            // Alternative language models
            alternativeLanguageCodes: ['en-GB', 'en-AU']
          },
          audio: {
            content: this.arrayBufferToBase64(audioData)
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google Speech API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseGoogleResponse(data);
    } catch (error) {
      console.error('Google Speech recognition error:', error);
      throw error;
    }
  }

  async synthesize(text: string, options?: SynthesisOptions): Promise<SynthesisResult> {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: this.config.language,
            name: options?.voice || 'en-US-Standard-C', // Female voice good for golf instructions
            ssmlGender: 'FEMALE'
          },
          audioConfig: {
            audioEncoding: options?.audioEncoding || 'MP3',
            speakingRate: options?.speakingRate || 1.0,
            pitch: options?.pitch || 0.0,
            volumeGainDb: options?.volumeGain || 0.0,
            effectsProfileId: ['headphone-class-device'] // Optimize for mobile/headphones
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google TTS API error: ${response.statusText}`);
      }

      const data = await response.json();
      const audioData = this.base64ToArrayBuffer(data.audioContent);

      return {
        audioData,
        duration: this.estimateAudioDuration(text, options?.speakingRate || 1.0),
        format: options?.audioEncoding || 'MP3'
      };
    } catch (error) {
      console.error('Google TTS error:', error);
      throw error;
    }
  }

  async startStreaming(): Promise<void> {
    // Implementation for streaming recognition
    // This would use WebSocket connection to Google's streaming API
    this.isStreamingActive = true;
  }

  async stopStreaming(): Promise<void> {
    this.isStreamingActive = false;
    if (this.streamingClient) {
      this.streamingClient.close();
      this.streamingClient = null;
    }
  }

  isStreaming(): boolean {
    return this.isStreamingActive;
  }

  private parseGoogleResponse(data: any): RecognitionResult {
    if (!data.results || data.results.length === 0) {
      return {
        transcript: '',
        confidence: 0,
        alternatives: [],
        isFinal: true
      };
    }

    const result = data.results[0];
    const alternative = result.alternatives[0];

    return {
      transcript: alternative.transcript || '',
      confidence: alternative.confidence || 0,
      alternatives: result.alternatives.map((alt: any) => ({
        transcript: alt.transcript || '',
        confidence: alt.confidence || 0
      })),
      wordTimings: alternative.words?.map((word: any) => ({
        word: word.word,
        startTime: parseFloat(word.startTime?.seconds || '0') + (parseFloat(word.startTime?.nanos || '0') / 1e9),
        endTime: parseFloat(word.endTime?.seconds || '0') + (parseFloat(word.endTime?.nanos || '0') / 1e9)
      })),
      isFinal: result.isFinal || false
    };
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private estimateAudioDuration(text: string, speakingRate: number): number {
    // Rough estimation: ~5 characters per second at normal rate
    const baseWordsPerSecond = 2.5;
    const adjustedRate = baseWordsPerSecond * speakingRate;
    const wordCount = text.split(' ').length;
    return wordCount / adjustedRate;
  }
}

export class AzureSpeechProvider implements SpeechProvider {
  private config: SpeechConfig;
  private isStreamingActive = false;

  constructor(config: SpeechConfig) {
    this.config = config;
  }

  async recognize(audioData: ArrayBuffer): Promise<RecognitionResult> {
    try {
      const response = await fetch(
        `https://${this.config.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${this.config.language}`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.apiKey,
            'Content-Type': 'audio/wav',
            'Accept': 'application/json'
          },
          body: audioData
        }
      );

      if (!response.ok) {
        throw new Error(`Azure Speech API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAzureResponse(data);
    } catch (error) {
      console.error('Azure Speech recognition error:', error);
      throw error;
    }
  }

  async synthesize(text: string, options?: SynthesisOptions): Promise<SynthesisResult> {
    const ssml = this.generateSSML(text, options);

    try {
      const response = await fetch(
        `https://${this.config.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.apiKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': this.getAzureAudioFormat(options?.audioEncoding),
            'User-Agent': 'GolfCaddyAI'
          },
          body: ssml
        }
      );

      if (!response.ok) {
        throw new Error(`Azure TTS API error: ${response.statusText}`);
      }

      const audioData = await response.arrayBuffer();

      return {
        audioData,
        duration: this.estimateAudioDuration(text, options?.speakingRate || 1.0),
        format: options?.audioEncoding || 'MP3'
      };
    } catch (error) {
      console.error('Azure TTS error:', error);
      throw error;
    }
  }

  async startStreaming(): Promise<void> {
    this.isStreamingActive = true;
    // Implementation for Azure streaming would go here
  }

  async stopStreaming(): Promise<void> {
    this.isStreamingActive = false;
  }

  isStreaming(): boolean {
    return this.isStreamingActive;
  }

  private parseAzureResponse(data: any): RecognitionResult {
    if (data.RecognitionStatus !== 'Success') {
      return {
        transcript: '',
        confidence: 0,
        alternatives: [],
        isFinal: true
      };
    }

    return {
      transcript: data.DisplayText || '',
      confidence: data.Confidence || 0,
      alternatives: [], // Azure doesn't provide alternatives in this format
      isFinal: true
    };
  }

  private generateSSML(text: string, options?: SynthesisOptions): string {
    const voice = options?.voice || 'en-US-AriaNeural';
    const rate = options?.speakingRate ? `${Math.round(options.speakingRate * 100)}%` : '100%';
    const pitch = options?.pitch ? `${options.pitch > 0 ? '+' : ''}${Math.round(options.pitch * 50)}%` : '0%';

    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${this.config.language}">
        <voice name="${voice}">
          <prosody rate="${rate}" pitch="${pitch}">
            ${this.escapeXmlText(text)}
          </prosody>
        </voice>
      </speak>
    `;
  }

  private escapeXmlText(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private getAzureAudioFormat(encoding?: string): string {
    const formatMap: Record<string, string> = {
      'MP3': 'audio-24khz-48kbitrate-mono-mp3',
      'WAV': 'riff-24khz-16bit-mono-pcm',
      'OGG': 'ogg-24khz-16bit-mono-opus'
    };

    return formatMap[encoding || 'MP3'];
  }

  private estimateAudioDuration(text: string, speakingRate: number): number {
    const baseWordsPerSecond = 2.5;
    const adjustedRate = baseWordsPerSecond * speakingRate;
    const wordCount = text.split(' ').length;
    return wordCount / adjustedRate;
  }
}

export class SpeechManager {
  private provider: SpeechProvider;
  private config: SpeechConfig;
  private isInitialized = false;

  constructor(config: SpeechConfig) {
    this.config = config;
    this.initializeProvider();
  }

  private initializeProvider(): void {
    switch (this.config.provider) {
      case 'google':
        this.provider = new GoogleSpeechProvider(this.config);
        break;
      case 'azure':
        this.provider = new AzureSpeechProvider(this.config);
        break;
      default:
        throw new Error(`Unsupported speech provider: ${this.config.provider}`);
    }
    this.isInitialized = true;
  }

  async recognizeSpeech(audioData: ArrayBuffer): Promise<RecognitionResult> {
    if (!this.isInitialized) {
      throw new Error('Speech manager not initialized');
    }

    try {
      return await this.provider.recognize(audioData);
    } catch (error) {
      console.error('Speech recognition failed:', error);
      throw error;
    }
  }

  async synthesizeSpeech(text: string, options?: SynthesisOptions): Promise<SynthesisResult> {
    if (!this.isInitialized) {
      throw new Error('Speech manager not initialized');
    }

    // Pre-process text for golf context
    const processedText = this.preprocessTextForGolf(text);

    try {
      return await this.provider.synthesize(processedText, options);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      throw error;
    }
  }

  async startStreamingRecognition(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Speech manager not initialized');
    }

    return this.provider.startStreaming();
  }

  async stopStreamingRecognition(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Speech manager not initialized');
    }

    return this.provider.stopStreaming();
  }

  isStreamingActive(): boolean {
    return this.provider.isStreaming();
  }

  private preprocessTextForGolf(text: string): string {
    // Add pauses and pronunciation hints for golf terms
    return text
      .replace(/(\d+)\s*yards?/gi, '$1 yards') // Ensure space before "yards"
      .replace(/7-iron/gi, 'seven iron')
      .replace(/3-wood/gi, 'three wood')
      .replace(/mph/gi, 'miles per hour')
      .replace(/°/g, ' degrees')
      .replace(/(\d+)\s*feet?/gi, '$1 feet')
      .replace(/uphill/gi, 'up hill')
      .replace(/downhill/gi, 'down hill');
  }

  updateConfig(newConfig: Partial<SpeechConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeProvider();
  }

  getConfig(): SpeechConfig {
    return { ...this.config };
  }

  // Utility methods for audio handling
  static async recordAudio(durationMs: number = 5000): Promise<ArrayBuffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          stream.getTracks().forEach(track => track.stop());
          resolve(arrayBuffer);
        };

        mediaRecorder.onerror = (error) => {
          stream.getTracks().forEach(track => track.stop());
          reject(error);
        };

        mediaRecorder.start();
        setTimeout(() => {
          mediaRecorder.stop();
        }, durationMs);

      } catch (error) {
        reject(error);
      }
    });
  }

  static async playAudio(audioData: ArrayBuffer, format: string = 'MP3'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const blob = new Blob([audioData], { type: `audio/${format.toLowerCase()}` });
        const audio = new Audio();
        audio.src = URL.createObjectURL(blob);

        audio.onended = () => {
          URL.revokeObjectURL(audio.src);
          resolve();
        };

        audio.onerror = (error) => {
          URL.revokeObjectURL(audio.src);
          reject(error);
        };

        audio.play();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Voice activity detection
  static detectVoiceActivity(audioData: ArrayBuffer): boolean {
    // Simple energy-based voice activity detection
    const samples = new Int16Array(audioData);
    const threshold = 500; // Adjust based on environment
    let energy = 0;

    for (let i = 0; i < samples.length; i++) {
      energy += Math.abs(samples[i]);
    }

    const averageEnergy = energy / samples.length;
    return averageEnergy > threshold;
  }
}