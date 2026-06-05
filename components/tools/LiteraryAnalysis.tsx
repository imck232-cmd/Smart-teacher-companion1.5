
import React, { useState } from 'react';
import { analyzeLiteraryText } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';
import ReactMarkdown from 'react-markdown';

const COMPREHENSIVE_ANALYSIS_PROMPT = `
قم بتحليل النص الأدبي المقدم تحليلاً شاملاً ودقيقاً وتفصيلياً بناءً على المنهجية التالية، وتأكد من تغطية جميع النقاط:

أولاً: التحليل الأدبي:
1- التعريف بالشاعر أو الكاتب:
- الاسم الكامل.
- أهم المؤلفات والدور الأدبي في المشهد الثقافي.
- السمات والخصائص المميزة للشاعر أو الكاتب (الأسلوب والموضوعات المتكررة).
2- التعريف بالنص الأدبي:
- تحديد زمن وعصر النص بدقة.
- رصد سمات المدرسة الأدبية أو العصر التي ينتمي إليها النص.
- تحليل التجربة العاطفية والغرض من النص.
- مناقشة الأفكار الأساسية، مظاهر التقليد والتجديد فيه.
- استعراض الصور التعبيرية والألفاظ المتداولة والتراكيب اللغوية المستخدمة.
- تقييم الوحدة العضوية للنص ومدى موضوعيته.

ثانياً: التحليل اللغوي:
- بيان معنى الكلمات الغريبة.
- التحليل اللغوي: (المفرد، المثنى، الجمع).
- العلاقات الدلالية: (الضد [المقابل]، المرادف) وغيرها.

ثالثاً: التحليل الصرفي:
- نوع المشتقات: (اسم فاعل، اسم مفعول، اسم تفضيل، اسم زمان، اسم مكان، اسم آلة، صيغة مبالغة).
- أنواع المصادر: (مصدر صريح، مصدر ميمي، مصدر صناعي، مصدر مرة، مصدر هيئة).
- وزن الكلمات: (أسماء، أفعال).

رابعاً: التحليل الإملائي:
- دراسة الظواهر الإملائية: (الهمزات، الألف اللينة، التاء المربوطة والمفتوحة، الحذف والزيادة، وغيرها).

خامساً: التحليل البلاغي:
أ/ قسم المعاني: (الأساليب، الإيجاز، الإطناب، التعريف والتنكير، عطف الجمل والمفردات).
ب/ قسم البيان:
1- الصور الكلية: (الصوت واللون والحركة).
2- الصور الجزئية: (التشبيه، الاستعارة، الكناية، المجاز المرسل).
ج/ قسم البديع: (محسنات لفظية، ومحسنات معنوية).

سادساً: التحليل النقدي الفني:
1- الفكرة.
2- الأغراض والموضوعات.
3- العاطفة.
4- الألفاظ.
5- التراكيب (الأساليب).
6- الصور.
7- الموسيقا الداخلية: (بديع، تكرار، أوزان صرفية موحدة).
8- الموسيقا الخارجية: (الوزن والقافية وحرف الروي).
9- سمات وخصائص الأدب الذي ينتمي إليه من خلال النص.

سابعاً: ملحوظات نقدية (تقييم):
1- الفكرة: (سطحية أم عميقة).
2- الغرض: (تقليدي أم مبتكر، واقعي أم خيالي).
3- العاطفة: (قوتها، ضعفها، نوعها: قومية، إنسانية، ذاتية).
4- الألفاظ: (قوية، سهلة، مدى مناسبتها للفكرة والعاطفة).
5- الجمل والأسلوب: (خبري، إنشائي، حصر وقصر، وأثرها).
6- الصور والأخيلة: (التوظيف الفني، تقليدية أم مبتكرة).
7- التجربة والوحدة: (تجربة ذاتية/عامة، الوحدة العضوية والموضوعية، الصدق الفني).
8- الموسيقا الداخلية ودورها.
9- الموسيقا الخارجية وأثرها (الوزن، القافية).

ثامناً: خلاصة نقدية وتحليلية عامة:
1. المقدمة والسياق (لمحة موجزة، نوع النص، السياق التاريخي).
2. الموضوعات والأفكار الرئيسية والرسائل الضمنية.
3. الشخصيات (في السرد): السمات، الدوافع، العلاقات، الرمزية.
4. الحبكة والصراع (في السرد): البنية، الصراع، التحولات.
5. الأسلوب واللغة: (الوضوح/الغموض، الأدوات البلاغية وأثرها، جو النص).
6. الرمزية والصور الشعرية ودلالاتها.
7. الرؤية والنبرة (وجهة النظر، نبرة النص).
8. الخاتمة (أهمية النص، الرأي الشخصي المدعم بالأدلة).

الرجاء تقديم الإجابة بتنسيق منظم وواضح جداً باستخدام العناوين والنقاط (Markdown).
`;

const LiteraryAnalysis: React.FC<{ onBack: () => void }> = ({ onBack }) => {
 const [text, setText] = useState('');
 const [userNote, setUserNote] = useState('');
 const [result, setResult] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState('');

 const handleAnalysis = async () => {
 if (!text.trim()) {
 setError('الرجاء إدخال النص الأدبي.');
 return;
 }
 setIsLoading(true);
 setError('');
 setResult('');
 
 // Combine the comprehensive instruction with any specific user note
 let finalPrompt = COMPREHENSIVE_ANALYSIS_PROMPT;
 if (userNote.trim()) {
 finalPrompt += `\n\nملاحظة إضافية من المستخدم يجب مراعاتها: ${userNote}`;
 }

 try {
 const response = await analyzeLiteraryText(text, finalPrompt);
 setResult(response.text);
 } catch (err) {
 setError('حدث خطأ أثناء التحليل. الرجاء المحاولة مرة أخرى.');
 console.error(err);
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div>
 <ToolHeader title="تحليل النصوص الأدبية" onBack={onBack} />
 <div className="neumorphic-outset p-6">
 <label className="font-semibold mb-2 block text-base-text">النص المراد تحليله:</label>
 <textarea
 value={text}
 onChange={(e) => setText(e.target.value)}
 placeholder="أدخل النص هنا (بيت شعري، قصيدة، أو نص نثري)..."
 className="w-full p-3 neumorphic-inset h-40 bg-transparent text-base-text focus:outline-none"
 disabled={isLoading}
 />
 <label className="font-semibold my-2 block text-base-text">ملاحظات إضافية للتحليل (اختياري):</label>
 <input
 type="text"
 value={userNote}
 onChange={(e) => setUserNote(e.target.value)}
 placeholder="مثال: ركز على الجانب البلاغي بشكل أكبر..."
 className="w-full p-3 neumorphic-inset bg-transparent text-base-text focus:outline-none"
 disabled={isLoading}
 />
 <button
 onClick={handleAnalysis}
 disabled={isLoading}
 className="w-full mt-4 neumorphic-button bg-primary text-white font-bold py-3 px-4 disabled:opacity-50"
 >
 {isLoading ? 'جاري التحليل الشامل...' : 'حلل النص'}
 </button>
 {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
 {result && (
 <div className="mt-6 neumorphic-outset p-4" id="pdf-content">
 <div className="prose dark:prose-invert max-w-none text-base-text">
 <ReactMarkdown>{result}</ReactMarkdown>
 </div>
 <ActionButtons textToCopy={result} elementIdToPrint="pdf-content" />
 </div>
 )}
 </div>
 </div>
 );
};

export default LiteraryAnalysis;
