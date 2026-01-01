
import { GoogleGenAI, Modality } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        console.error("API_KEY environment variable is not set.");
        throw new Error("API Key is not configured. Please contact support.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

/**
 * Robust JSON cleaner for AI responses
 * Strips markdown code blocks and handles common syntax issues like trailing commas
 */
const cleanJsonString = (str: string): string => {
    let cleaned = str.trim();
    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '');
    // Remove trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    return cleaned;
};

/**
 * Generates bulk educational content for multiple lessons
 */
export const generateBulkSemesterContent = async (lessons: {title: string}[], subject: string) => {
    try {
        const client = getAiClient();
        const titles = lessons.map(l => l.title).join(' | ');
        const prompt = `
        بصفتك خبيراً تربوياً، قم بتوليد محتوى تعليمي مفصل لكل درس من الدروس التالية لمادة ${subject}.
        الدروس: [${titles}]
        
        المطلوب لكل درس تعبئة القيم التالية بدقة:
        - objectives: الأهداف التعليمية السلوكية.
        - methods: استراتيجيات وطرائق التدريس.
        - aids: الوسائل التعليمية المقترحة.
        - activitiesIn: الأنشطة الصفية.
        - activitiesOut: الأنشطة اللاصفية.
        - values: القيم التربوية.
        - evaluation: أساليب التقويم.
        
        اجعل العبارات تربوية، دقيقة ومختصرة لتناسب الجداول.
        
        أرجع النتيجة بتنسيق JSON حصراً كمصفوفة كائنات بنفس ترتيب الدروس:
        [
            {
                "objectives": "...",
                "methods": "...",
                "aids": "...",
                "activitiesIn": "...",
                "activitiesOut": "...",
                "values": "...",
                "evaluation": "..."
            }
        ]
        `;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        const cleanedText = cleanJsonString(response.text || '');
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error generating bulk content:", error);
        throw error;
    }
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
        You are an expert educational assistant. Analyze the following lesson plan text and extract the information to fill a structured JSON object.
        Strict constraints for output:
        1. 'intro.text': Must be summarized to maximum 2 lines.
        2. 'content': Must be summarized into exactly 5-6 bullet points max.
        Output JSON keys: 
        'lessonTitle', 'subject', 'classLevel', 'methods' (array), 'aids' (array), 
        'intro': { "text": "...", "type": "..." }, 
        'objectives' (array of objects with domain, level, text, evaluation), 
        'content', 
        'activities',
        'teacherRole', 'learnerRole',
        'closure': { "text": "...", "type": "..." }, 
        'homework': { "text": "...", "type": "..." },
        'reflection'.
        Text to analyze:
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
        const cleanedText = cleanJsonString(response.text || '');
        return JSON.parse(cleanedText);
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

export const generateSemesterRowContent = async (lessonTitle: string, subject: string) => {
    try {
        const client = getAiClient();
        const prompt = `
        بصفتك خبيراً تربوياً، قم بتوليد محتوى تعليمي موجز ومناسب لصف واحد في خطة دراسية.
        المادة: ${subject}
        عنوان الدرس: ${lessonTitle}
        
        المطلوب هو تعبئة الحقول التالية بدقة واختصار شديد (كل حقل في سطر واحد أو نقطتين فقط):
        1. الأهداف التعليمية.
        2. طرائق التدريس.
        3. الوسائل التعليمية.
        4. الأنشطة الصفية واللاصفية.
        5. القيم التربوية المرتبطة.
        6. أساليب التقويم.
        
        أرجع النتيجة بتنسيق JSON حصراً:
        {
            "objectives": "...",
            "methods": "...",
            "aids": "...",
            "activitiesIn": "...",
            "activitiesOut": "...",
            "values": "...",
            "evaluation": "..."
        }
        `;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        const cleanedText = cleanJsonString(response.text || '');
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error generating row content:", error);
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
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, 
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
        const prompt = `
        بصفتك خبيراً تربوياً، قم بإعداد تحضير درس نموذجي ومختصر جداً ليتناسب مع صفحة A4 واحدة.
        المعلومات الأساسية:
        النص/الموضوع: ${inputText}
        المادة: ${context.subject || 'عام'}
        الصف: ${context.grade || 'عام'}
        المخرجات بتنسيق JSON حصراً:
        {
            "lessonTitle": "عنوان الدرس (إن لم يحدد)",
            "intro": { "text": "...", "type": "..." },
            "methods": ["...", "..."],
            "aids": ["...", "..."],
            "activities": "...",
            "objectives": [
                { "domain": "معرفي", "level": "...", "text": "...", "evaluation": "..." },
                ...
            ],
            "teacherRole": "...",
            "learnerRole": "...",
            "content": "...",
            "closure": { "text": "...", "type": "..." },
            "homework": { "text": "...", "type": "..." },
            "reflection": "..."
        }
        `;
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        const cleanedText = cleanJsonString(response.text || '');
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error generating lesson plan:", error);
        throw error;
    }
};

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

export const generateStructuredExam = async (content: string, config: any) => {
    try {
        const client = getAiClient();
        let distributionInstructions = "";
        if (config.detailedTypes && typeof config.detailedTypes === 'object') {
             const posMap: Record<string, string[]> = {};
             Object.entries(config.detailedTypes).forEach(([type, details]: [string, any]) => {
                 const pos = details.position || 'q1';
                 const count = details.count;
                 if(!posMap[pos]) posMap[pos] = [];
                 posMap[pos].push(`${count} أسئلة من نوع: ${type}`);
             });
             distributionInstructions = Object.entries(posMap).map(([posKey, typesArr]) => {
                 const posName = posKey === 'q1' ? 'السؤال الأول' : 
                                 posKey === 'q2' ? 'السؤال الثاني' :
                                 posKey === 'q3' ? 'السؤال الثالث' :
                                 posKey === 'q4' ? 'السؤال الرابع' : 'السؤال الخامس';
                 return `في قسم "${posKey}" (${posName})، ضع: ${typesArr.join(' و ')}.`;
             }).join('\n');
        } else {
            distributionInstructions = "قم بتوزيع الأسئلة بالتساوي على الأقسام الخمسة.";
        }
        const prompt = `
        بصفتك خبيراً تربوياً، قم بإنشاء اختبار مدرسي رسمي بناءً على المحتوى التالي والبيانات المحددة.
        المحتوى/الدرس: ${content}
        بيانات الاختبار:
        المادة: ${config.subject}
        الصف: ${config.grade}
        توزيع الأسئلة المطلوب بدقة: ${distributionInstructions}
        شروط خاصة: ${config.customInstructions || "لا يوجد"}
        الدرجة الكلية: ${config.totalMarks}
        هيكل JSON المطلوب:
        {
            "q1": { "title": "...", "content": "...", "subQuestions": ["..."] },
            ...
            "gradingTable": { "q1": 10, ... "total": 50 }
        }
        `;
        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        const cleanedText = cleanJsonString(response.text || '');
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error generating structured exam:", error);
        throw error;
    }
};
