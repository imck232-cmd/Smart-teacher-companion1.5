
import React, { useState, useRef } from 'react';
import ToolHeader from '../ToolHeader';

interface CurriculumLink {
    country: string;
    name: string;
    url: string;
    icon: string;
}

const officialLinks: CurriculumLink[] = [
    { country: 'اليمن', name: 'المناهج الدراسية (موقع الأمجاد)', url: 'https://www.al-amgaad.com/2022/08/all-books-yemen.html', icon: 'https://cdn-icons-png.flaticon.com/512/323/323303.png' },
    { country: 'عام', name: 'مكتبة نور (كتب تعليمية)', url: 'https://www.noor-book.com/', icon: 'fas fa-book' },
];

const CurriculumDownloader: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [myFiles, setMyFiles] = useState<{ name: string; size: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMyFiles(prev => [...prev, { 
                name: file.name, 
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB' 
            }]);
        }
    };

    const handleDeleteFile = (index: number) => {
        setMyFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div>
            <ToolHeader title="تنزيل المنهج والتحكم به" onBack={onBack} />
            
            <div className="space-y-8">
                {/* Section 1: Official Downloads */}
                <div className="neumorphic-outset p-6">
                    <h3 className="text-xl font-bold text-primary mb-4 border-b border-gray-200 pb-2">
                        <i className="fas fa-globe-americas ml-2"></i> بوابات المناهج الرسمية
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        روابط مباشرة لتحميل الكتب الدراسية:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {officialLinks.map((link, idx) => (
                            <a 
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/50 transition-all group"
                            >
                                {link.icon.startsWith('http') ? (
                                    <img src={link.icon} alt={link.country} className="w-10 h-10 object-contain" />
                                ) : (
                                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <i className={`${link.icon} text-xl`}></i>
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-base-text group-hover:text-primary transition-colors">{link.country}</h4>
                                    <p className="text-xs text-gray-500">{link.name}</p>
                                </div>
                                <i className="fas fa-external-link-alt mr-auto text-gray-300 group-hover:text-primary"></i>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Section 2: Local File Management (Mock) */}
                <div className="neumorphic-outset p-6 bg-blue-50/50 border border-blue-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-blue-800">
                            <i className="fas fa-folder-open ml-2"></i> مكتبتي الخاصة (تنظيم المنهج)
                        </h3>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="neumorphic-button bg-blue-600 text-white px-4 py-2 text-sm font-bold flex items-center gap-2"
                        >
                            <i className="fas fa-upload"></i> إضافة ملف
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                        />
                    </div>
                    
                    {myFiles.length > 0 ? (
                        <div className="space-y-2">
                            {myFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <i className="fas fa-file-pdf text-red-500 text-xl"></i>
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{file.name}</p>
                                            <p className="text-xs text-gray-500">{file.size}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                                            <i className="fas fa-eye"></i>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteFile(idx)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-white/50">
                            <i className="fas fa-cloud-upload-alt text-4xl text-gray-300 mb-2"></i>
                            <p className="text-gray-500 font-medium">لم تقم بإضافة أي ملفات للمنهج بعد.</p>
                            <p className="text-xs text-gray-400 mt-1">يمكنك رفع ملفات PDF أو Word لتنظيمها هنا.</p>
                        </div>
                    )}
                </div>

                {/* Section 3: PDF Tools */}
                <div className="neumorphic-outset p-6 bg-red-50/50 border border-red-100">
                    <h3 className="text-xl font-bold text-red-800 mb-4 border-b border-red-200 pb-2">
                        <i className="fas fa-file-pdf ml-2"></i> أدوات PDF
                    </h3>
                    <a 
                        href="https://tools.pdf24.org/ar/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 rounded-xl bg-white border border-red-200 shadow-sm hover:shadow-md transition-all group"
                    >
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center bg-red-100 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <i className="fas fa-tools text-2xl"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">التحكم بملف PDF</h4>
                                <p className="text-sm text-gray-500">أدوات مجانية لدمج، ضغط، وتحويل ملفات PDF (PDF24)</p>
                            </div>
                         </div>
                         <div className="neumorphic-button bg-red-600 text-white px-4 py-2 text-sm font-bold flex items-center">
                            فتح الأدوات <i className="fas fa-external-link-alt mr-2"></i>
                         </div>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default CurriculumDownloader;
