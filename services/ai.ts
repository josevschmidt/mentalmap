import { GoogleGenAI, Type } from "@google/genai";

// Initialize the client. The API key is guaranteed to be in process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates related sub-topics for a given node text.
 */
export const generateSubTopics = async (
  topic: string,
  existingChildren: string[]
): Promise<string[]> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      You are a helpful brainstorming assistant.
      The user has a mind map node with the text: "${topic}".
      Generate 3 to 5 distinct, creative, and relevant sub-topics to expand this idea.
      ${existingChildren.length > 0 ? `Avoid these existing topics: ${existingChildren.join(', ')}.` : ''}
      Keep the topics concise (1-4 words max).
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    const topics: string[] = JSON.parse(jsonText);
    return topics;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};