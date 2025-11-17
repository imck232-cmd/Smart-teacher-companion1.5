import React from 'react';
import ToolHeader from '../ToolHeader';

interface ComingSoonProps {
  toolName: string;
  onBack: () => void;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ toolName, onBack }) => {
  return (
    <div>
      <ToolHeader title={toolName} onBack={onBack} />
      <div className="neumorphic-outset flex flex-col items-center justify-center text-center p-10">
        <i className="fas fa-tools text-6xl text-icon mb-6"></i>
        <h3 className="text-2xl font-bold mb-2 text-heading-text">قريباً...</h3>
        <p className="text-lg text-base-text">
          نحن نعمل بجد على تطوير أداة "{toolName}". ترقبوا التحديثات!
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;