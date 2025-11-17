import React from 'react';
import ToolHeader from '../ToolHeader';
import ComingSoon from './ComingSoon';


const ExamCreator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return <ComingSoon toolName="إنشاء اختبار" onBack={onBack} />;
};

export default ExamCreator;
