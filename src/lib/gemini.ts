import { GoogleGenerativeAI, GenerativeModel, Schema } from '@google/generative-ai';

let genAIClient: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(apiKey);
  }

  return genAIClient;
}

export interface ModelOptions {
  systemInstruction?: string;
  responseSchema?: Schema;
  temperature?: number;
  modelName?: string;
}

/**
 * Returns a configured Gemini generative model with strict temperature and JSON schema decoding.
 */
export function getStructuredModel(options: ModelOptions): GenerativeModel {
  const client = getGeminiClient();
  const modelName = options.modelName || process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  return client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: options.temperature ?? 0,
      responseMimeType: options.responseSchema ? 'application/json' : 'text/plain',
      responseSchema: options.responseSchema,
    },
    systemInstruction: options.systemInstruction,
  });
}
