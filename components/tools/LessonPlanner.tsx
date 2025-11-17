import React, { useState } from 'react';
import { fillLessonPlanFromText } from '../../services/geminiService';
import ToolHeader from '../ToolHeader';
import ActionButtons from '../ActionButtons';

type LessonPlan = {
  lessonTitle: string;
  subject: string;
  classLevel: string;
  teachingMethods: string;
  teachingAids: string;
  lessonIntro: string;
  behavioralObjectives: string[];
  lessonContent: string;
  lessonClosure: string;
  homework: string;
};

const initialPlan: LessonPlan = {
  lessonTitle: '',
  subject: '',
  classLevel: '',
  teachingMethods: '',
  teachingAids: '',
  lessonIntro: '',
  behavioralObjectives: [],
  lessonContent: '',
  lessonClosure: '',
  homework: '',
};

const LessonPlanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [pastedText, setPastedText] = useState('');
  const [lessonPlan, setLessonPlan] = useState<LessonPlan>(initialPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAutoFill = async () => {
    if (!pastedText.trim()) {
      setError('الرجاء لصق نص التحضير.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const filledPlan = await fillLessonPlanFromText(pastedText);
      setLessonPlan(filledPlan);
    } catch (err) {
      setError('حدث خطأ أثناء ملء البيانات. الرجاء المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const planToString = () => {
    return Object.entries(lessonPlan)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\n');
  }

  return (
    <div>
      <ToolHeader title="إنشاء تحضير درس" onBack={onBack} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="neumorphic-outset p-6">
          <h3 className="font-bold text-lg mb-2 text-heading-text">لصق التحضير الجاهز</h3>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="الصق نص التحضير هنا ليتم توزيعه على الحقول تلقائياً..."
            className="w-full p-3 neumorphic-inset h-96 bg-transparent text-base-text focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleAutoFill}
            disabled={isLoading}
            className="w-full mt-4 neumorphic-button bg-primary text-white font-bold py-3 px-4 disabled:opacity-50"
          >
            {isLoading ? 'جاري التعبئة...' : 'تعبئة تلقائية'}
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
        <div className="neumorphic-outset p-6">
          <h3 className="font-bold text-lg mb-2 text-heading-text">نموذج تحضير الدرس</h3>
          <div id="pdf-content">
            <pre className="p-4 neumorphic-inset whitespace-pre-wrap text-sm h-[28rem] overflow-auto bg-transparent text-base-text">
              {JSON.stringify(lessonPlan, null, 2)}
            </pre>
          </div>
          <ActionButtons textToCopy={planToString()} elementIdToPrint="pdf-content" />
        </div>
      </div>
    </div>
  );
};

export default LessonPlanner;