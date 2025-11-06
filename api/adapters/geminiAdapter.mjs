/**
 * Gemini API Adapter
 * Handles all interactions with Google Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ApiError } from '../middleware/errorHandler.mjs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get laptop recommendations
export async function getRecommendations({ budget, usage, preferences, userId }) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert laptop advisor for AI Bradaa, a Malaysia-first laptop recommendation service.

User Requirements:
- Budget: MYR ${budget}
- Primary Usage: ${usage}
- Preferences: ${JSON.stringify(preferences)}

Based on these requirements, recommend the top 3 laptops that would be perfect for this user.
Consider performance, value for money, and availability in Malaysia.

Return your response as JSON with this structure:
{
  "recommendations": [
    {
      "name": "Laptop Model Name",
      "brand": "Brand",
      "price": 0000,
      "reasoning": "Why this laptop is recommended",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "score": 85
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse JSON from response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // If JSON parsing fails, return as text
      return { recommendations: [], rawText: text };
    }

    return { recommendations: [] };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new ApiError('Failed to get recommendations from AI', 500);
  }
}

// Chat with Gemini
export async function chatWithGemini({ message, context, userId }) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build conversation history
    const history = context.map(msg => ({
      role: msg.role,
      parts: msg.content
    }));

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(message);
    const response = await result.response;

    return {
      message: response.text(),
      role: 'assistant'
    };
  } catch (error) {
    console.error('Gemini chat error:', error);
    throw new ApiError('Failed to chat with AI', 500);
  }
}

// Generate laptop comparison
export async function compareLaptops(laptopIds) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Compare these laptops: ${laptopIds.join(', ')}

Provide a detailed comparison covering:
- Performance
- Value for money
- Build quality
- Battery life
- Use case suitability

Return as structured JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return { comparison: response.text() };
  } catch (error) {
    console.error('Gemini comparison error:', error);
    throw new ApiError('Failed to compare laptops', 500);
  }
}
