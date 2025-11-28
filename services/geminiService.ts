
import { GoogleGenAI, Modality } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    // We do not cache the client (singleton) anymore because the API Key might change 
    // during the session (e.g. via window.aistudio.openSelectKey() for Pro models).
    // Always creating a new instance ensures we use the current process.env.API_KEY.
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        console.error("API_KEY environment variable is not set.");
        throw new Error("API Key is not configured. Please contact support.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
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

export const generateExam = async (topic: string, numQuestions: number, questionTypes: string[]) => {
    const questionTypesString = questionTypes.join(', ');
    const prompt = `
        You are an expert in creating educational assessments. Your task is to generate an exam based on the following topic.

        **Topic:**
        ${topic}

        **Exam Requirements:**
        - Number of questions: ${numQuestions}
        - Question types: ${questionTypesString}

        **Instructions:**
        1. Generate exactly ${numQuestions} questions.
        2. Distribute the questions among the requested types (${questionTypesString}).
        3. For multiple-choice questions, provide 4 options (A, B, C, D) and clearly indicate the correct answer.
        4. For true/false questions, provide a statement.
        5. For short-answer questions, ask a question that requires a brief written response.
        6. Format the output clearly using Markdown. Use headings for each question type.
        7. Provide a separate answer key at the end of the exam.
    `;
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response;
    } catch (error) {
        console.error("Error generating exam:", error);
        throw error;
    }
};

export const summarizeText = async (text: string) => {
    try {
        const client = getAiClient();
        const prompt = `قم بتلخيص النص التعليمي التالي بشكل موجز وشامل، مع التركيز على النقاط الرئيسية والمفاهيم الهامة:\n\n${text}`;
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response;
    } catch (error) {
        console.error("Error summarizing text:", error);
        throw error;
    }
};

export const generateSemesterPlan = async (subject: string, grade: string, semester: string, weeks: number) => {
    try {
        const client = getAiClient();
        const prompt = `
        بصفتك خبيرًا تربويًا ومطور مناهج، قم بإعداد خطة فصلية دراسية شاملة لمادة ${subject} للصف ${grade} للفصل الدراسي ${semester}.
        عدد الأسابيع الدراسية المتاحة: ${weeks}.
        
        المخرجات المطلوبة: جدول منظم يوضح توزيع المنهج على الأسابيع، متضمنًا الأعمدة التالية:
        - الأسبوع
        - الوحدة / المحور
        - الموضوعات التفصيلية للدرس
        - الأهداف العامة
        - عدد الحصص المقترح
        - ملاحظات / أنشطة مقترحة
        
        يرجى تنسيق الإجابة باستخدام Markdown (جدول) ليكون جاهزًا للنسخ والطباعة.
        `;
        const response = await client.models.generateContent({
            model: "gemini-2.5-pro", 
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 2048 }
            }
        });
        return response;
    } catch (error) {
        console.error("Error creating semester plan:", error);
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

export const generateSmartLessonPlan = async (inputText: string, context: any) => {
    try {
        const client = getAiClient();
        // Enforce limits in prompt: 2 lines intro, 6 points content
        const prompt = `
        بصفتك خبيراً تربوياً، قم بإعداد تحضير درس نموذجي ومختصر جداً بناءً على:
        النص/الموضوع: ${inputText}
        المادة: ${context.subject || 'عام'}
        الصف: ${context.grade || 'عام'}
        
        المخرجات بتنسيق JSON حصراً:
        {
            "lessonTitle": "عنوان الدرس (إن لم يحدد)",
            "intro": { "text": "سطرين كحد أقصى", "type": "نوع التمهيد" },
            "methods": ["طريقة 1", "طريقة 2", "طريقة 3", "طريقة 4", "طريقة 5"],
            "aids": ["وسيلة 1", "وسيلة 2", "وسيلة 3", "وسيلة 4", "وسيلة 5"],
            "activities": "وصف موجز للأنشطة",
            "objectives": [
                { "domain": "معرفي", "level": "...", "text": "...", "evaluation": "..." },
                { "domain": "معرفي", "level": "...", "text": "...", "evaluation": "..." },
                { "domain": "معرفي", "level": "...", "text": "...", "evaluation": "..." },
                { "domain": "مهاري", "level": "...", "text": "...", "evaluation": "..." },
                { "domain": "مهاري", "level": "...", "text": "...", "evaluation": "..." },
                { "domain": "وجداني", "level": "...", "text": "...", "evaluation": "..." }
            ],
            "teacherRole": "دور المعلم باختصار",
            "learnerRole": "دور الطالب باختصار",
            "content": "محتوى الدرس في 6 نقاط فقط (قائمة منقطة مركزة)",
            "closure": { "text": "خاتمة في سطر واحد", "type": "نوع الغلق" },
            "homework": { "text": "الواجب", "type": "نوعه" },
            "reflection": "خاطرة قصيرة"
        }
        
        قيود صارمة:
        1. التمهيد لا يتجاوز سطرين.
        2. محتوى الدرس يجب أن يكون 6 نقاط فقط.
        3. الاختصار قدر الإمكان لتناسب ورقة A4 واحدة.
        `;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating lesson plan:", error);
        throw error;
    }
};

// --- NEW SERVICES ---

// Audio Transcription using gemini-2.5-flash
export const transcribeAudioFile = async (base64Audio: string, mimeType: string) => {
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Audio } },
                    { text: "Transcribe this audio file accurately into the original language." }
                ]
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        throw error;
    }
};

export const startProChat = (prompt: string) => {
    try {
        const client = getAiClient();
        return client.models.generateContentStream({
            model: 'gemini-3-pro-preview',
            contents: prompt,
        });
    } catch (error) {
        console.error("Error starting pro chat:", error);
        throw error;
    }
};

export const generateProImage = async (prompt: string, size: string) => {
    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [
                    { text: prompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: "1:1",
                    imageSize: size as any
                }
            }
        });
        return response;
    } catch (error) {
        console.error("Error generating pro image:", error);
        throw error;
    }
};
