import OpenAI from 'openai';

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    'HTTP-Referer': 'https://gradex.pro',
    'X-Title': 'GradeX',
  },
});

export const MODEL = 'arcee-ai/trinity-large-preview:free';
