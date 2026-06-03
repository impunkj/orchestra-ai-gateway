import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const isLocalEnvironment = process.env.AI_PROVIDER === 'LOCAL';

/**
 * Centrally configured AI Gateway Client.
 * Automatically handles local container routing or high-performance cloud configurations.
 */
export const aiClient = new OpenAI({
  // If CLOUD is selected, check if a custom base URL like Groq is provided; fallback to standard OpenAI
  baseURL: process.env.LOCAL_AI_BASE_URL || (isLocalEnvironment ? 'http://localhost:11434/v1' : 'https://api.openai.com/v1'),
  apiKey: process.env.OPENAI_API_KEY || 'sandbox-token',
});

// Select the targeted model instance from your environment variables
export const TARGET_MODEL = process.env.LOCAL_AI_MODEL || 'llama3-8b-8192';

// Define the tool blueprint so the LLM knows its parameters and purpose
export const GATEWAY_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'getLiveWeather',
      description: 'Fetches the current, real-time weather details for a specific city location.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city name, e.g., New Delhi, London, New York',
          },
        },
        required: ['location'],
      },
    },
  },
];



console.log(`\n[AI-Config]  Proxy routing established via: ${process.env.AI_PROVIDER}`);
console.log(`[AI-Config] Active Target Model: ${TARGET_MODEL}`);
console.log(`[AI-Config]  Endpoint Target: ${aiClient.baseURL}\n`);