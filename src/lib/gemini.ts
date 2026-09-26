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
  const modelName = options.modelName || process.env.GEMINI_MODEL || 'gemini-3.8-flash';

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

const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite'];

/**
 * Generates content using the configured Gemini model, automatically failing over
 * to alternative fast models if encountering transient 503 (high demand) or 429 errors.
 */
export async function generateContentWithFallback(
  options: ModelOptions,
  prompt: string
) {
  const primaryModel = options.modelName || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const candidateModels = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  let lastError: unknown;
  for (const modelName of candidateModels) {
    try {
      const model = getStructuredModel({ ...options, modelName });
      const result = await model.generateContent(prompt);
      return result;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : '';
      const isTransient =
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('429') ||
        msg.includes('404') ||
        msg.includes('500');

      if (!isTransient) {
        throw err;
      }
      console.warn(`[gemini_fallback] Model ${modelName} transient error, failing over...`);
    }
  }
  throw lastError;
}
