import { GoogleGenAI, Modality } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (ai) {
        return ai;
    }
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        console.error("API_KEY environment variable is not set.");
        throw new Error("API Key is not configured. Please contact support.");
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });
    return ai;
};


export const performSearch = async (query: string) => {
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response;
  } catch (error) {
    console.error("Error performing search:", error);
    throw error;
  }
};

export const innovateWithGemini = async (prompt: string) => {
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return response;
    } catch (error) {
        console.error("Error with innovate prompt:", error);
        throw error;
    }
};

export const analyzeLiteraryText = async (text: string, prompt: string) => {
    try {
        const client = getAiClient();
        const fullPrompt = `${prompt}\n\nالنص المراد تحليله:\n\`\`\`\n${text}\n\`\`\``;
        const response = await client.models.generateContent({
            model: "gemini-2.5-pro",
            contents: fullPrompt
        });
        return response;
    } catch (error) {
        console.error("Error analyzing literary text:", error);
        throw error;
    }
};

const SOLVE_QUESTIONS_PROMPT = `You are an expert educational assistant. Your task is to carefully read the provided text or analyze the image from a textbook. Identify only the specific discussion questions related to the lesson content. Provide clear and concise answers for each of these questions. Do not perform any other type of analysis. Present the answers in a structured and easy-to-read format.`;

export const analyzeImageAndSolve = async (imageBase64: string, mimeType: string) => {
    try {
        const client = getAiClient();
        const imagePart = {
            inlineData: {
                mimeType,
                data: imageBase64,
            },
        };
        const textPart = {
            text: SOLVE_QUESTIONS_PROMPT,
        };
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        return response;

    } catch (error) {
        console.error("Error analyzing image:", error);
        throw error;
    }
};

export const solveQuestionsFromText = async (text: string) => {
    const fullPrompt = `${SOLVE_QUESTIONS_PROMPT}\n\nالنص المراد تحليله:\n\`\`\`\n${text}\n\`\`\``;
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });
        return response;
    } catch (error) {
        console.error("Error solving questions from text:", error);
        throw error;
    }
};


export const fillLessonPlanFromText = async (pastedText: string) => {
    const prompt = `
        You are an expert educational assistant. Analyze the following lesson plan text and extract the information to fill a structured form. Provide the output as a JSON object with the following keys: 'lessonTitle', 'subject', 'classLevel', 'teachingMethods', 'teachingAids', 'lessonIntro', 'behavioralObjectives' (as an array of strings), 'lessonContent', 'lessonClosure', 'homework'. If a field is not mentioned, leave its value as an empty string.

        Lesson Plan Text:
        ---
        ${pastedText}
        ---
    `;
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error processing lesson plan text:", error);
        throw error;
    }
};

export const startChat = (prompt: string) => {
    try {
        const client = getAiClient();
        return client.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
    } catch (error) {
        console.error("Error starting chat:", error);
        throw error;
    }
};

export const analyzeImageGeneral = async (imageBase64: string, mimeType: string, prompt: string) => {
    try {
        const client = getAiClient();
        const imagePart = { inlineData: { mimeType, data: imageBase64 } };
        const textPart = { text: prompt };
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });
        return response;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw error;
    }
};

export const generateSpeech = async (text: string) => {
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A pleasant default voice
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech:", error);
        throw error;
    }
};