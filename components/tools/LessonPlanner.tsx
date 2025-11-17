import React from 'react';
import ToolHeader from '../ToolHeader';

const LessonPlanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const aiStudioUrl = "https://aistudio.google.com/apps/drive/1w6VsUELbUzM2QWkRzNKVdQ8LhhUWAyes?showPreview=true&showAssistant=true";

  return (
    <div>
      <ToolHeader title="إنشاء تحضير درس" onBack={onBack} />
      <div className="neumorphic-outset p-6 text-center">
        <i className="fas fa-magic text-6xl text-icon mb-6"></i>
        <h3 className="text-2xl font-bold mb-2 text-heading-text">تحضير الدروس أصبح أسهل!</h3>
        <p className="text-lg text-base-text mb-6">
          لقد قمنا بتجهيز تطبيق متخصص في Google AI Studio لمساعدتك في إنشاء خطط دروس متكاملة بكل سهولة. انقر على الزر أدناه للانتقال إليه مباشرة.
        </p>
        <a
          href={aiStudioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="neumorphic-button inline-block w-full max-w-sm text-center p-4 bg-primary text-white font-semibold text-lg"
        >
          الانتقال إلى مساعد تحضير الدروس
          <i className="fas fa-external-link-alt text-sm mr-2"></i>
        </a>
      </div>
    </div>
  );
};

export default LessonPlanner;
