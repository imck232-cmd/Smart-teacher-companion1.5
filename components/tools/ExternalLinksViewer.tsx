import React from 'react';
import { ToolKey, externalLinkTools } from '../../constants';
import ToolHeader from '../ToolHeader';

interface ExternalLinksViewerProps {
  toolKey: ToolKey;
  title: string;
  onBack: () => void;
}

const ExternalLinksViewer: React.FC<ExternalLinksViewerProps> = ({ toolKey, title, onBack }) => {
  const toolInfo = externalLinkTools[toolKey];

  if (!toolInfo) {
    return (
      <div>
        <ToolHeader title={title} onBack={onBack} />
        <p>لم يتم العثور على روابط لهذه الأداة.</p>
      </div>
    );
  }

  return (
    <div>
      <ToolHeader title={toolInfo.title} onBack={onBack} />
      <div className="neumorphic-outset p-6">
        <p className="mb-4 text-base-text">لإنجاز هذه المهمة، يمكنك الاستعانة بالأدوات الخارجية التالية:</p>
        <div className="space-y-4">
          {toolInfo.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="neumorphic-button block w-full text-center p-3 bg-primary text-white font-semibold"
            >
              {link.name} <i className="fas fa-external-link-alt text-sm mr-2"></i>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExternalLinksViewer;