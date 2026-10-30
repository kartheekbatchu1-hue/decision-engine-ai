import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
  console.warn('⚠️  GROQ_API_KEY is not configured. AI analysis will be unavailable.');
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

