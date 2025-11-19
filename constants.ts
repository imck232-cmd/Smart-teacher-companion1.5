
// Fix: Define ToolKey here to avoid circular dependency
export type ToolKey =
  | 'search'
  | 'addNote'
  | 'summarizeLesson'
  | 'solveBookQuestions'
  | 'analyzeLiterary'
  | 'createStory'
  | 'createVideoSummary'
  | 'createPowerpoint'
  | 'createTeachingAid'
  | 'formulateQuestions'
  | 'createExam'
  | 'periodicTests'
  | 'createLessonPlan'
  | 'createSemesterPlan'
  | 'createSchoolBroadcast'
  | 'createSchoolCelebration'
  | 'textToSpeech'
  | 'createImage'
  | 'createLogo'
  | 'designCover'
  | 'createVideo'
  | 'createBarcode'
  | 'textToSong'
  | 'yourTasks'
  | 'classSchedule'
  | 'importantDates'
  | 'createAIPrompts'
  | 'innovate'
  | 'archives'
  | 'chatBot'
  | 'imageAnalyzer'
  | 'textToSpeechInternal'
  | 'createFlashcards';

interface Tool {
  key: ToolKey;
  label: string;
  icon: string;
}

export const tools: Tool[] = [
  { key: 'search', label: 'البحث العام', icon: 'fas fa-search' },
  { key: 'chatBot', label: 'المحادثة الفورية', icon: 'fas fa-comments' },
  { key: 'imageAnalyzer', label: 'تحليل الصور', icon: 'fas fa-camera-retro' },
  { key: 'createFlashcards', label: 'البطاقات التعليمية', icon: 'fas fa-clone' },
  { key: 'addNote', label: 'إضافة ملاحظة', icon: 'fas fa-sticky-note' },
  { key: 'summarizeLesson', label: 'تلخيص درس', icon: 'fas fa-file-alt' },
  { key: 'solveBookQuestions', label: 'حل أسئلة الكتاب', icon: 'fas fa-book-open' },
  { key: 'analyzeLiterary', label: 'تحليل النصوص الأدبية', icon: 'fas fa-feather-alt' },
  { key: 'createStory', label: 'إنشاء قصة لدرس', icon: 'fas fa-book' },
  { key: 'createVideoSummary', label: 'إنشاء ملخص فيديو لدرس', icon: 'fas fa-video' },
  { key: 'createPowerpoint', label: 'إنشاء عرض باوربوينت', icon: 'fas fa-file-powerpoint' },
  { key: 'createTeachingAid', label: 'إنشاء وسيلة لدرس', icon: 'fas fa-paint-brush' },
  { key: 'formulateQuestions', label: 'صياغة الأسئلة وتصنيفها', icon: 'fas fa-question-circle' },
  { key: 'createExam', label: 'إنشاء اختبار', icon: 'fas fa-pencil-ruler' },
  { key: 'periodicTests', label: 'اختبارات دورية', icon: 'fas fa-calendar-check' },
  { key: 'createLessonPlan', label: 'إنشاء تحضير درس', icon: 'fas fa-clipboard-list' },
  { key: 'createSemesterPlan', label: 'إنشاء خطة فصلية', icon: 'fas fa-calendar-alt' },
  { key: 'createSchoolBroadcast', label: 'إنشاء إذاعة مدرسية', icon: 'fas fa-microphone-alt' },
  { key: 'createSchoolCelebration', label: 'إنشاء احتفال مدرسي', icon: 'fas fa-gift' },
  { key: 'textToSpeech', label: 'تحويل النص إلى صوت (روابط)', icon: 'fas fa-volume-up' },
  { key: 'textToSpeechInternal', label: 'تحويل النص إلى صوت (تجريبي)', icon: 'fas fa-microphone-alt' },
  { key: 'createImage', label: 'إنشاء صورة', icon: 'fas fa-image' },
  { key: 'createLogo', label: 'إنشاء شعار', icon: 'fas fa-drafting-compass' },
  { key: 'designCover', label: 'تصميم غلاف', icon: 'fas fa-swatchbook' },
  { key: 'createVideo', label: 'إنشاء فيديو', icon: 'fas fa-film' },
  { key: 'createBarcode', label: 'إنشاء باركود', icon: 'fas fa-barcode' },
  { key: 'textToSong', label: 'تحويل النص إلى إنشودة', icon: 'fas fa-music'},
  { key: 'yourTasks', label: 'مهامك', icon: 'fas fa-tasks' },
  { key: 'classSchedule', label: 'جدول الحصص', icon: 'fas fa-table' },
  { key: 'importantDates', label: 'تواريخ تهمك', icon: 'fas fa-calendar-day' },
  { key: 'createAIPrompts', label: 'إنشاء أوامر للذكاء الاصطناعي', icon: 'fas fa-magic' },
  { key: 'innovate', label: 'ابتكر', icon: 'fas fa-lightbulb' },
  { key: 'archives', label: 'المحفوظات', icon: 'fas fa-archive' },
];

interface ExternalLink {
    name: string;
    url: string;
}

export const externalLinkTools: Record<ToolKey, { title: string; links: ExternalLink[] }> = {
    createStory: { title: 'إنشاء قصة لدرس', links: [{ name: 'CapCut', url: 'https://www.capcut.com/' }] },
    createVideoSummary: { title: 'إنشاء ملخص فيديو لدرس', links: [{ name: 'NotebookLM', url: 'https://notebooklm.google/' }] },
    createPowerpoint: {
        title: 'إنشاء عرض باوربوينت لدرس',
        links: [
            { name: 'Chat Z', url: 'https://chat.z.ai/' },
            { name: 'SlidesGo', url: 'https://slidesgo.com/' },
            { name: 'Gamma', url: 'https://gamma.app/ar' },
        ],
    },
    createTeachingAid: {
        title: 'إنشاء وسيلة لدرس',
        links: [
            { name: 'Chat Z', url: 'https://chat.z.ai/' },
            { name: 'AI Studio', url: 'https://aistudio.google.com/apps' },
        ],
    },
    formulateQuestions: { title: 'صياغة الأسئلة وتصنيفها', links: [{ name: 'DeepSeek', url: 'https://chat.deepseek.com/' }] },
    periodicTests: { title: 'اختبارات دورية', links: [{ name: 'Gemini', url: 'https://gemini.google.com/' }] },
    createSchoolBroadcast: {
        title: 'إنشاء إذاعة مدرسية',
        links: [
            { name: 'Gemini', url: 'https://gemini.google.com/' },
            { name: 'DeepSeek', url: 'https://chat.deepseek.com/' },
            { name: 'ChatGPT', url: 'https://chatgpt.com/' },
        ],
    },
    createSchoolCelebration: {
        title: 'إنشاء احتفال مدرسي',
        links: [
            { name: 'Gemini', url: 'https://gemini.google.com/' },
            { name: 'DeepSeek', url: 'https://chat.deepseek.com/' },
            { name: 'ChatGPT', url: 'https://chatgpt.com/' },
        ],
    },
    textToSpeech: {
        title: 'تحويل النص إلى صوت',
        links: [
            { name: 'AI Studio Speech', url: 'https://aistudio.google.com/generate-speech' },
            { name: 'ElevenLabs', url: 'https://elevenlabs.io/' },
            { name: 'OpenAI FM', url: 'https://www.openai.fm/' },
        ],
    },
    createImage: {
        title: 'إنشاء صورة',
        links: [
            { name: 'Yupp', url: 'https://yupp.ai/' },
            { name: 'Vheer', url: 'https://vheer.com/' },
            { name: 'Luma Dream Machine', url: 'https://dream-machine.lumalabs.ai/' },
            { name: 'Pexels', url: 'https://www.pexels.com/' },
            { name: 'Google Labs Whisk', url: 'https://labs.google/fx/tools/whisk/project' },
        ],
    },
    createLogo: { title: 'إنشاء شعار', links: [{ name: 'Playground', url: 'https://playground.com/' }] },
    designCover: {
        title: 'تصميم غلاف',
        links: [
            { name: 'Adobe Firefly', url: 'https://firefly.adobe.com/' },
            { name: 'Canva', url: 'https://www.canva.com/' },
        ],
    },
    createVideo: {
        title: 'إنشاء فيديو',
        links: [
            { name: 'Higgsfield', url: 'https://higgsfield.ai/effects' },
            { name: 'VideoScribe', url: 'https://www.videoscribe.co/' },
            { name: 'Canva', url: 'https://www.canva.com/' },
            { name: 'Kie', url: 'https://kie.ai/' },
            { name: 'Komiko', url: 'https://komiko.app/' },
            { name: 'ToMoviee', url: 'https://www.tomoviee.ai/' },
            { name: 'LipSync Video', url: 'https://lipsync.video/ar' },
            { name: 'Kling AI', url: 'https://app.klingai.com/' },
            { name: 'PixVerse', url: 'https://app.pixverse.ai/home?tab=video' },
            { name: 'Mixkit', url: 'https://mixkit.co/' },
            { name: 'Luma Dream Machine', url: 'https://dream-machine.lumalabs.ai/' },
        ],
    },
    createBarcode: {
        title: 'إنشاء باركود',
        links: [
            { name: 'QR Code Monkey', url: 'https://www.qrcode-monkey.com/ar/' },
            { name: 'Emergent', url: 'https://app.emergent.sh/' },
        ],
    },
    textToSong: {
        title: 'تحويل النص إلى إنشودة',
        links: [
            { name: 'Suno', url: 'https://suno.com/' },
        ]
    }
} as any;
