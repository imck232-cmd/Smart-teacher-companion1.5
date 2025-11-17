import React from 'react';
import ToolHeader from '../ToolHeader';
import ComingSoon from './ComingSoon';

const Archives: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return <ComingSoon toolName="المحفوظات" onBack={onBack} />;
};

export default Archives;
