
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
    // This function analyzes an existing lesson plan text and extracts data into the JSON schema
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
        // Enforce limits in prompt: 2 lines intro, 5-6 points content
        const prompt = `
        بصفتك خبيراً تربوياً، قم بإعداد تحضير درس نموذجي ومختصر جداً ليتناسب مع صفحة A4 واحدة.
        
        المعلومات الأساسية:
        النص/الموضوع: ${inputText}
        المادة: ${context.subject || 'عام'}
        الصف: ${context.grade || 'عام'}
        
        المخرجات بتنسيق JSON حصراً:
        {
            "lessonTitle": "عنوان الدرس (إن لم يحدد)",
            "intro": { "text": "اكتب تمهيداً مختصراً جداً (سطرين كحد أقصى)", "type": "نوع التمهيد" },
            "methods": ["طريقة 1", "طريقة 2", "طريقة 3", "طريقة 4", "طريقة 5"],
            "aids": ["وسيلة 1", "وسيلة 2", "وسيلة 3", "وسيلة 4", "وسيلة 5"],
            "activities": "اذكر نشاطاً واحداً أو اثنين باختصار شديد",
            "objectives": [
                { "domain": "معرفي", "level": "...", "text": "...", "evaluation": "..." },
                { "domain": "معرفي", "level": "...", "text": "...", "evaluation": "..." },
                { "domain": "معرفي", "level": "...", "text": "...", "evaluation": "..." },
                { "domain": "مهاري", "level": "...", "text": "...", "evaluation": "..." },
                { "domain": "مهاري", "level": "...", "text": "...", "evaluation": "..." },
                { "domain": "وجداني", "level": "...", "text": "...", "evaluation": "..." }
            ],
            "teacherRole": "دور المعلم (جملة واحدة)",
            "learnerRole": "دور الطالب (جملة واحدة)",
            "content": "محتوى الدرس في شكل نقاط مركزة (5 إلى 6 نقاط فقط).",
            "closure": { "text": "خاتمة (سطر واحد)", "type": "نوع الغلق" },
            "homework": { "text": "الواجب", "type": "نوعه" },
            "reflection": "خاطرة قصيرة"
        }
        
        تنبيه هام: التزم بالاختصار الشديد في "التمهيد" و"المحتوى" لضمان عدم تجاوز الصفحة الواحدة عند الطباعة.
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

export const generateStructuredExam = async (content: string, config: any) => {
    try {
        const client = getAiClient();
        // Generate a description string from the complex types object
        let typesDescription = "";
        if (config.detailedTypes && typeof config.detailedTypes === 'object') {
             typesDescription = Object.entries(config.detailedTypes)
                .map(([type, count]) => `${count} أسئلة من نوع: ${type}`)
                .join('، ');
        } else {
            typesDescription = config.examType;
        }

        const prompt = `
        بصفتك خبيراً تربوياً، قم بإنشاء اختبار مدرسي رسمي بناءً على المحتوى التالي والبيانات المحددة.
        
        المحتوى/الدرس:
        ${content}
        
        بيانات الاختبار:
        المادة: ${config.subject}
        الصف: ${config.grade}
        توزيع الأسئلة المطلوب: ${typesDescription}
        الدرجة الكلية: ${config.totalMarks}
        
        المطلوب: قم بإنشاء الأسئلة وتوزيعها في هيكل JSON الدقيق التالي ليتم تعبئته في القالب الرسمي.
        
        تعليمات تنسيق الأسئلة (مهم جداً):
        1. **أسئلة الصواب والخطأ:** يجب أن تبدأ كل فقرة بـ قوسين فارغين ( ) في بداية السطر ليضع الطالب العلامة، مثال: ( ) تقع اليمن في قارة آسيا.
        2. **أسئلة الاختيار من متعدد:** اكتب السؤال، ثم ضع الخيارات (أ، ب، ج، د) تحته في سطر جديد أو سطور منفصلة بشكل واضح لضمان مساحة للإجابة.
        3. **الأسئلة المقالية/التكميل:** اترك فراغات (نقط ...............) مناسبة لطول الإجابة المتوقعة.
        4. **عناوين الأسئلة:** استخدم صيغ رسمية مثل "السؤال الأول:"، "السؤال الثاني:".
        
        هيكل JSON المطلوب (5 أقسام رئيسية):
        {
            "q1": { "title": "السؤال الأول: ...", "content": "...", "subQuestions": ["( ) فقرة 1", "( ) فقرة 2"] },
            "q2": { "title": "السؤال الثاني: ...", "content": "...", "subQuestions": ["سؤال...\\nأ. خيار 1   ب. خيار 2..."] },
            "q3": { "title": "السؤال الثالث: ...", "content": "...", "subQuestions": ["..."] },
            "q4": { "title": "السؤال الرابع: ...", "content": "...", "subQuestions": ["..."] },
            "q5": { "title": "السؤال الخامس: ...", "content": "...", "subQuestions": ["..."] },
            "gradingTable": { "q1": 10, "q2": 10, "q3": 10, "q4": 10, "q5": 10, "total": 50 }
        }
        
        وزع أنواع الأسئلة المطلوبة (${typesDescription}) على الأقسام الخمسة بذكاء.
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
        console.error("Error generating structured exam:", error);
        throw error;
    }
};
