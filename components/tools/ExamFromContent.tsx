import React, { useState, useRef, useMemo, useEffect } from "react";
import ToolHeader from "../ToolHeader";
import ActionButtons from "../ActionButtons";

// Declare libraries for file reading and export
declare const pdfjsLib: any;
declare const mammoth: any;
declare const html2canvas: any;
declare const jspdf: any;

const offlineParseExam = (text: string) => {
  const parsedData: any = {
    q1: { title: "", content: "", subQuestions: ["", "", ""] },
    q2: { title: "", content: "", subQuestions: ["", "", ""] },
    q3: { title: "", content: "", subQuestions: ["", "", ""] },
    q4: { title: "", content: "", subQuestions: ["", "", ""] },
    q5: { title: "", content: "", subQuestions: ["", "", ""] },
    gradingTable: { q1: 10, q2: 10, q3: 10, q4: 10, q5: 10, total: 50 },
  };

  const qKeys = ["q1", "q2", "q3", "q4", "q5"];
  const qNames = [
    "السؤال الأول",
    "السؤال الثاني",
    "السؤال الثالث",
    "السؤال الرابع",
    "السؤال الخامس",
  ];

  qNames.forEach((qName, i) => {
    const qKey = qKeys[i];
    const regex = new RegExp(`\\[${qName}\\]\\s*\\n(.*?)(?=\\n\\[|$)`, "s");
    const sectionMatch = text.match(regex);
    if (sectionMatch) {
      const section = sectionMatch[1];

      const titleMatch = section.match(/-\s*العنوان:\s*(.*)/);
      if (titleMatch) parsedData[qKey].title = titleMatch[1].trim();

      const textMatch = section.match(/-\s*النص:\s*(.*)/);
      if (textMatch) parsedData[qKey].content = textMatch[1].trim();

      const subQSection = section.match(/-\s*الأسئلة الفرعية:\s*\n([\s\S]*)/);
      if (subQSection) {
        const subQs = subQSection[1]
          .split("\n")
          .filter((l) => l.trim() && /^[-*0-9.]+\s*/.test(l))
          .map((l) => l.replace(/^[-*0-9.]+\s*/, "").trim());
        if (subQs.length > 0) {
          parsedData[qKey].subQuestions = subQs;
        }
      }
    }
  });

  const marksRegex = /\[توزيع الدرجات\]\s*\n(.*?)(?=\n\[|$)/s;
  const marksMatch = text.match(marksRegex);
  if (marksMatch) {
    const marksText = marksMatch[1];
    qNames.forEach((qName, i) => {
      const markLine = marksText.match(new RegExp(`${qName}:\\s*(\\d+)`));
      if (markLine) parsedData.gradingTable[qKeys[i]] = parseInt(markLine[1]);
    });
    const totalLine = marksText.match(/المجموع الكلي:\s*(\\d+)/);
    if (totalLine) parsedData.gradingTable.total = parseInt(totalLine[1]);
  }

  return parsedData;
};

const questionTypesList = [
  "صح / خطأ",
  "اختيار من متعدد",
  "ملء الفراغ",
  "المقابلة (المزاوجة)",
  "الترتيب",
  "المقالية",
  "الإيجاز (قصيرة)",
  "تصنيف المجموعات",
  "اختبار الأداء",
  "أسئلة الرسم البياني",
  "حل المشكلات",
  "أسئلة التكميل",
  "الأسئلة التشخيصية",
  "الأسئلة الاستنباطية",
  "الأسئلة التطبيقية",
  "أسئلة التحليل",
  "أسئلة التركيب",
  "أسئلة التقويم",
  "أسئلة الصح والخطأ المعدلة",
];

const gradesList = [
  "التمهيدي",
  "الأول الأساسي",
  "الثاني الأساسي",
  "الثالث الأساسي",
  "الرابع الأساسي",
  "الخامس الأساسي",
  "السادس الأساسي",
  "السابع الأساسي",
  "الثامن الأساسي",
  "التاسع الأساسي",
  "الأول الثانوي",
  "الثاني الثانوي",
  "الثالث الثانوي",
];

const subjectsList = [
  "القرآن الكريم",
  "التربية الإسلامية",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "العلوم",
  "الكيمياء",
  "الفيزياء",
  "الأحياء",
  "الاجتماعيات",
  "الحاسوب",
  "المكتبة",
  "الفنية",
  "المختص الاجتماعي",
  "الأنشطة",
  "أخرى",
];

const positions = [
  { id: "q1", label: "السؤال الأول" },
  { id: "q2", label: "السؤال الثاني" },
  { id: "q3", label: "السؤال الثالث" },
  { id: "q4", label: "السؤال الرابع" },
  { id: "q5", label: "السؤال الخامس" },
];

const ExamFromContent: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  // Input State
  const [contentInput, setContentInput] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState({
    ministry: "وزارة التربية والتعليم والبحث العلمي",
    district: "",
    school: "",
    teacher: "",
    subject: "",
    month: "صفر",
    year: "1447",
    semester: "الأول",
    grade: "الثامن",
    date: new Date().toISOString().split("T")[0],
    day: new Date().toLocaleDateString("ar-EG", { weekday: "long" }),
    model: "أ",
    time: "ساعة ونصف",
    totalMarks: "50",
    instructions: "أجب مستعيناً بالله عن جميع الأسئلة الآتية:",
    customInstructions: "", // New field for specific user constraints
  });

  // Multi-select Question Types State with POSITION
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<
    Record<string, { count: number; position: string }>
  >({
    "صح / خطأ": { count: 3, position: "q1" },
    "اختيار من متعدد": { count: 3, position: "q2" },
  });

  // Exam State
  const [isGenerating, setIsGenerating] = useState(false);
  const [examData, setExamData] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Initial Empty Exam Structure
  const initialExamStructure = {
    q1: { title: "السؤال الأول:", content: "", subQuestions: ["", "", ""] },
    q2: { title: "السؤال الثاني:", content: "", subQuestions: ["", "", ""] },
    q3: { title: "السؤال الثالث:", content: "", subQuestions: ["", "", ""] },
    q4: { title: "السؤال الرابع:", content: "", subQuestions: ["", "", ""] },
    q5: { title: "السؤال الخامس:", content: "", subQuestions: ["", "", ""] },
    gradingTable: { q1: 10, q2: 10, q3: 10, q4: 10, q5: 10, total: 50 },
  };

  const [renderedExam, setRenderedExam] = useState(initialExamStructure);
  const [copied, setCopied] = useState(false);

  // Generated prompt state/memo
  const generatedPrompt = useMemo(() => {
    // Group selected question types by position (q1 to q5)
    const grouped: Record<string, { type: string; count: number }[]> = {
      q1: [],
      q2: [],
      q3: [],
      q4: [],
      q5: [],
    };

    Object.entries(selectedQuestionTypes).forEach(([type, info]) => {
      if (grouped[info.position]) {
        grouped[info.position].push({ type, count: info.count });
      }
    });

    const arabicPositions: Record<string, string> = {
      q1: "السؤال الأول",
      q2: "السؤال الثاني",
      q3: "السؤال الثالث",
      q4: "السؤال الرابع",
      q5: "السؤال الخامس",
    };

    let promptText = `قم بإنشاء اختبار لمادة (${config.subject || "اكتب اسم المادة"}) للصف (${config.grade || "اكتب الصف"}) `;
    if (config.month) {
      promptText += `لشهر (${config.month}) `;
    }
    promptText += `بناءً على المحتوى أو الملف المرفق، واطبع المخرجات بهذا الشكل المنسق تماماً وحصرياً دون أي مقدمات ترحيبية، ودون أي تعليق أو خاتمة:\n\n`;

    let hasQuestions = false;
    Object.entries(grouped).forEach(([posKey, items]) => {
      if (items.length > 0) {
        hasQuestions = true;
        const posLabel = arabicPositions[posKey];
        // Combine types
        const typesStr = items.map((item) => item.type).join(" و ");
        let subQsText = "";
        let totalCount = 0;
        items.forEach((item) => {
          for (let i = 1; i <= item.count; i++) {
            totalCount++;
            let placeholder = "...";
            if (item.type.includes("صح") || item.type.includes("خطأ")) {
              placeholder = " ( ) ";
            } else if (
              item.type.includes("اختيار") ||
              item.type.includes("خيارات")
            ) {
              placeholder = " (أ... ب... ج... د...)";
            } else if (item.type.includes("فراغ")) {
              placeholder = " ....... ";
            }
            subQsText += `${totalCount}. السؤال الفرعي رقم ${totalCount} من نوع (${item.type}) هو: [اكتب نص السؤال هنا] ${placeholder}\n`;
          }
        });

        let headerText = "";
        if (typesStr.includes("صح")) {
          headerText = `أجب بوضع (صح) أمام العبارة الصحيحة و (خطأ) أمام الخاطئة:`;
        } else if (typesStr.includes("اختيار")) {
          headerText = `اختر الإجابة الصحيحة من الخيارات المطروحة لكل مما يلي:`;
        } else if (typesStr.includes("فراغ")) {
          headerText = `قم بملء الفراغات بالكلمات المناسبة:`;
        } else {
          headerText = `أجب عن الأسئلة الفرعية الآتية بتركيز:`;
        }

        promptText += `[${posLabel}]\n- العنوان: ${typesStr}\n- النص: ${headerText}\n- الأسئلة الفرعية:\n${subQsText}\n`;
      }
    });

    if (!hasQuestions) {
      promptText += `[السؤال الأول]
- العنوان: صح / خطأ
- النص: أجب بوضع (صح) أمام العبارة الصحيحة و (خطأ) أمام الخاطئة:
- الأسئلة الفرعية:
1. السؤال الأول الفرعي ( )
2. السؤال الثاني الفرعي ( )

[السؤال الثاني]
- العنوان: اختيار من متعدد
- النص: اختر الإجابة الصحيحة لكل مما يلي:
- الأسئلة الفرعية:
1. السؤال الأول الخيارات (أ... ب... ج...)
2. السؤال الثاني الخيارات (أ... ب... ج...)\n\n`;
    }

    promptText += `[توزيع الدرجات]\n`;
    let accumulatedTotal = 0;
    Object.entries(grouped).forEach(([posKey, items]) => {
      if (items.length > 0) {
        const posLabel = arabicPositions[posKey];
        const marksForThisQ =
          renderedExam.gradingTable[
            posKey as keyof typeof renderedExam.gradingTable
          ] || 10;
        promptText += `${posLabel}: ${marksForThisQ}\n`;
        accumulatedTotal += Number(marksForThisQ);
      }
    });
    if (!hasQuestions) {
      promptText += `السؤال الأول: 10\nالسؤال الثاني: 10\n`;
      accumulatedTotal = 20;
    }
    promptText += `المجموع الكلي: ${accumulatedTotal}\n`;

    if (config.customInstructions) {
      promptText += `\nشروط وتعليمات إضافية يجب الالتزام بها أثناء كتابة الأسئلة:\n- ${config.customInstructions}\n`;
    }

    return promptText;
  }, [
    selectedQuestionTypes,
    config.subject,
    config.grade,
    config.month,
    config.customInstructions,
    renderedExam.gradingTable,
  ]);

  const syncExamTemplateWithConfig = () => {
    const grouped: Record<string, { type: string; count: number }[]> = {
      q1: [],
      q2: [],
      q3: [],
      q4: [],
      q5: [],
    };

    Object.entries(selectedQuestionTypes).forEach(([type, info]) => {
      if (grouped[info.position]) {
        grouped[info.position].push({ type, count: info.count });
      }
    });

    const arabicPositions: Record<string, string> = {
      q1: "السؤال الأول",
      q2: "السؤال الثاني",
      q3: "السؤال الثالث",
      q4: "السؤال الرابع",
      q5: "السؤال الخامس",
    };

    const activePositions = Object.keys(grouped).filter(
      (pos) => grouped[pos].length > 0,
    );
    const numActive = activePositions.length || 1;
    const totalMarksNum = Number(config.totalMarks) || 50;

    const baseMark = Math.floor(totalMarksNum / numActive);
    const extra = totalMarksNum % numActive;

    const newGradingTable: Record<string, number> = {
      q1: 0,
      q2: 0,
      q3: 0,
      q4: 0,
      q5: 0,
      total: totalMarksNum,
    };

    activePositions.forEach((pos, idx) => {
      newGradingTable[pos] = baseMark + (idx === 0 ? extra : 0);
    });

    if (activePositions.length === 0) {
      newGradingTable.q1 = 10;
      newGradingTable.q2 = 10;
      newGradingTable.q3 = 10;
      newGradingTable.q4 = 10;
      newGradingTable.q5 = 10;
      newGradingTable.total = 50;
    }

    setRenderedExam((prev) => {
      const updated = { ...prev };
      updated.gradingTable = { ...newGradingTable } as any;

      Object.entries(grouped).forEach(([pos, items]) => {
        if (items.length > 0) {
          const titleTypes = items.map((it) => it.type).join(" و ");
          const posLabel = arabicPositions[pos];
          updated[pos as keyof typeof initialExamStructure].title =
            `${posLabel}: ${titleTypes}`;

          const totalCount = items.reduce((sum, item) => sum + item.count, 0);
          const currentSubs =
            updated[pos as keyof typeof initialExamStructure].subQuestions;
          const hasContent = currentSubs.some((s) => s && s.trim().length > 0);
          if (!hasContent || currentSubs.length !== totalCount) {
            updated[pos as keyof typeof initialExamStructure].subQuestions =
              Array(totalCount).fill("");
          }
        } else {
          updated[pos as keyof typeof initialExamStructure].title =
            `${arabicPositions[pos]}:`;
          updated[pos as keyof typeof initialExamStructure].subQuestions = [
            "",
            "",
            "",
          ];
        }
      });

      return updated;
    });
  };

  useEffect(() => {
    syncExamTemplateWithConfig();
  }, []);

  const handleCopyPrompt = () => {
    navigator.clipboard
      .writeText(generatedPrompt)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        const textArea = document.createElement("textarea");
        textArea.value = generatedPrompt;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
  };

  const handleStartCreation = () => {
    syncExamTemplateWithConfig();
    handleCopyPrompt();
    setShowModal(false);
    alert(
      "تم حفظ الإعدادات ونسخ الأمر الذكي (البرومبت) إلى الحافظة تلقائياً! قم بلصق الأمر في Gemini أو ChatGPT للحصول على الأسئلة.",
    );
  };

  const handleSaveConfig = () => {
    syncExamTemplateWithConfig();
    setShowModal(false);
  };

  // Helpers
  const safeString = (val: any): string => {
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    return "";
  };

  // File Handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    try {
      let extractedText = "";
      if (file.type === "application/pdf") {
        if (typeof pdfjsLib === "undefined")
          throw new Error("مكتبة PDF غير محملة");
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const maxPages = Math.min(pdf.numPages, 5);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText +=
            textContent.items.map((item: any) => item.str).join(" ") + "\n\n";
        }
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        if (typeof mammoth === "undefined")
          throw new Error("مكتبة Mammoth غير محملة");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({
          arrayBuffer: arrayBuffer,
        });
        extractedText = result.value;
      } else if (file.type === "text/plain") {
        extractedText = await file.text();
      } else {
        alert("نوع الملف غير مدعوم حالياً.");
        setIsReadingFile(false);
        return;
      }

      if (extractedText.trim().length === 0) alert("لم يتم العثور على نص.");
      else {
        setContentInput((prev) => prev + "\n\n" + extractedText);
        alert("تم استخراج النص!");
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء قراءة الملف.");
    } finally {
      setIsReadingFile(false);
      if (e.target) e.target.value = "";
    }
  };

  // Type Selection
  const handleTypeToggle = (type: string) => {
    setSelectedQuestionTypes((prev) => {
      const newState = { ...prev };
      if (newState[type]) {
        delete newState[type];
      } else {
        newState[type] = { count: 1, position: "q1" };
      }
      return newState;
    });
  };

  const handleTypeDetailsChange = (
    type: string,
    field: "count" | "position",
    value: any,
  ) => {
    setSelectedQuestionTypes((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: field === "count" ? Math.max(1, Number(value)) : value,
      },
    }));
  };

  // Offline parsing
  const handleStartGeneration = () => {
    if (!contentInput.trim()) {
      alert("الرجاء إدخال محتوى الاختبار أولاً.");
      return;
    }

    setIsGenerating(true);

    try {
      const parsedData = offlineParseExam(contentInput);
      setRenderedExam((prev) => ({
        ...prev,
        q1: parsedData.q1 || prev.q1,
        q2: parsedData.q2 || prev.q2,
        q3: parsedData.q3 || prev.q3,
        q4: parsedData.q4 || prev.q4,
        q5: parsedData.q5 || prev.q5,
        gradingTable: parsedData.gradingTable || prev.gradingTable,
      }));
      setTimeout(
        () =>
          document
            .getElementById("exam-export-container")
            ?.scrollIntoView({ behavior: "smooth" }),
        500,
      );
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء التفريغ. تأكد من أن النص يطابق الهيكل المطلوب.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExamChange = (
    section: string,
    field: string,
    value: string,
    subIndex?: number,
  ) => {
    setRenderedExam((prev: any) => {
      if (subIndex !== undefined && Array.isArray(prev[section][field])) {
        const newArr = [...prev[section][field]];
        newArr[subIndex] = value;
        return { ...prev, [section]: { ...prev[section], [field]: newArr } };
      } else if (section === "gradingTable") {
        return {
          ...prev,
          gradingTable: { ...prev.gradingTable, [field]: value },
        };
      } else {
        return { ...prev, [section]: { ...prev[section], [field]: value } };
      }
    });
  };

  // Custom Export for Multi-Page PDF
  const handleExportExamPDF = async () => {
    const page1 = document.getElementById("exam-page-1");
    const page2 = document.getElementById("exam-page-2");

    if (!page1 || !page2) return;

    setIsExporting(true);

    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 500)),
      ]);

      const canvas1 = await html2canvas(page1, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData1 = canvas1.toDataURL("image/jpeg", 0.8);

      const canvas2 = await html2canvas(page2, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData2 = canvas2.toDataURL("image/jpeg", 0.8);

      const pdf = new jspdf.jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData1, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.addPage();
      pdf.addImage(imgData2, "JPEG", 0, 0, pdfWidth, pdfHeight);

      pdf.save("exam.pdf");
    } catch (error) {
      console.error("PDF Export Error", error);
      alert("حدث خطأ أثناء تصدير ملف PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="pb-20" dir="rtl">
      <ToolHeader title="إنشاء وتفريغ الاختبار من ملف" onBack={onBack} />

      {/* Stepper & Dynamic Prompt Guiding */}
      <div className="bg-[#f8fafc] border border-gray-200/60 rounded-[2rem] p-6 lg:p-8 shadow-sm mb-8 no-print text-right">
        {/* Steps Card */}
        <div className="bg-amber-50 rounded-2xl p-6 mb-6 border border-amber-200/50">
          <h3 className="text-xl font-bold text-amber-700 mb-4 flex items-center gap-2 justify-start">
            <i className="fas fa-info-circle"></i>
            <span>اتبع الخطوات الآتية بدقة:</span>
          </h3>
          <ol className="space-y-3 text-gray-800 font-medium list-none p-0 pr-1 text-right">
            <li className="flex items-start gap-3 justify-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs mt-0.5">
                1
              </span>
              <p className="text-sm">
                قم بنسخ الأمر (البرومبت) الموجود في الأسفل وألصقه في Gemini أو
                ChatGPT.
              </p>
            </li>
            <li className="flex items-start gap-3 justify-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs mt-0.5">
                2
              </span>
              <p className="text-sm">
                أرفق الملف (PDF/Word) للدرس الذي تريد اختبار منه (اختياري).
              </p>
            </li>
            <li className="flex items-start gap-3 justify-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs mt-0.5">
                3
              </span>
              <p className="text-sm">
                قم بإرسال الطلب، ثم انسخ الجواب الذي سيعطيك إياه الذكاء
                الاصطناعي.
              </p>
            </li>
            <li className="flex items-start gap-3 justify-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs mt-0.5">
                4
              </span>
              <p className="text-sm">
                ألصق الجواب في المربع أدناه، ثم اضغط على زر "تفريغ وتعبئة
                الجدول".
              </p>
            </li>
          </ol>
        </div>

        {/* Prompt Copy Area */}
        <div className="mb-6 relative border border-gray-200 rounded-2xl bg-white p-4 shadow-sm text-right">
          <div className="flex justify-between items-center mb-2 flex-row-reverse">
            <span className="text-sm font-bold text-blue-600 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full">
              <i className="fas fa-magic"></i>
              الأمر الذكي (البرومبت) الجاهز حسب خياراتك
            </span>
            <button
              onClick={handleCopyPrompt}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${copied ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"}`}
            >
              <i className={copied ? "fas fa-check" : "fas fa-copy"}></i>
              <span>{copied ? "تم نسخ الأمر بنجاح!" : "نسخ الأمر الذكي"}</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed text-right">
            يتم تحديث هذا الأمر تلقائياً بناءً على ما تحدده في زر "تحديث
            البيانات الأساسية للاختبار".
          </p>
          <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs font-mono text-gray-700 text-right whitespace-pre-wrap leading-relaxed select-all">
            {generatedPrompt}
          </div>
        </div>

        {/* Big Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-gray-100 pt-6 text-right">
          <div className="text-right flex-grow">
            <h4 className="font-bold text-gray-800 text-sm mb-1">
              البيانات الحالية المعتمدة:
            </h4>
            <p className="text-xs text-gray-600">
              المادة:{" "}
              <b className="text-blue-600">{config.subject || "لم تحدد"}</b> |
              الصف: <b className="text-blue-600">{config.grade || "لم تحدد"}</b>{" "}
              | الدرجة الكلية:{" "}
              <b className="text-blue-600">{config.totalMarks}</b> | الشهر:{" "}
              <b className="text-blue-600">{config.month || "لم يحدد"}</b>
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 border border-blue-200 font-bold hover:bg-blue-100 rounded-xl transition-all"
          >
            <i className="fas fa-edit"></i>
            <span>تحديث البيانات وتحديد الأسئلة</span>
          </button>
        </div>
      </div>

      {/* Output Receiver Area */}
      <div
        className="bg-white border border-gray-200/60 rounded-[2rem] p-6 lg:p-8 shadow-sm mb-8 no-print text-center"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="text-right w-full mb-1">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 justify-start">
              <i className="fas fa-paste text-blue-600"></i>
              <span>ألصق جواب الذكاء الاصطناعي (الأسئلة والدرجات) هنا:</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              قم بلصق الاستجابة الكاملة المستلمة من ChatGPT أو Gemini في الحقل
              أدناه.
            </p>
          </div>
          <textarea
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            placeholder="ألصق الجواب هنا (مثال: [السؤال الأول] - العنوان: ...)"
            className="w-full h-48 p-4 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner resize-y text-right"
          />
          <div className="flex flex-wrap justify-center gap-4 w-full">
            <button
              onClick={handleStartGeneration}
              className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 font-bold text-lg shadow-lg hover:bg-blue-700 rounded-xl cursor-pointer"
            >
              <i className="fas fa-table"></i>
              <span>تفريغ وتعبئة الجدول</span>
            </button>
            {contentInput && (
              <button
                onClick={() => setContentInput("")}
                className="flex items-center justify-center gap-2 bg-gray-100 text-gray-600 px-6 py-3.5 font-bold hover:bg-gray-200 rounded-xl transition-all"
              >
                <i className="fas fa-trash-alt"></i>
                <span>تفريغ المربع</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-6 animate-scaleIn">
            <h3 className="text-2xl font-bold text-center text-blue-800 mb-6 border-b pb-4">
              إعدادات الاختبار
            </h3>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 ">
                  المنطقة التعليمية
                </label>
                <input
                  type="text"
                  value={config.district}
                  onChange={(e) =>
                    setConfig({ ...config, district: e.target.value })
                  }
                  className="w-full p-2 border rounded bg-white text-black "
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 ">
                  المدرسة
                </label>
                <input
                  type="text"
                  value={config.school}
                  onChange={(e) =>
                    setConfig({ ...config, school: e.target.value })
                  }
                  className="w-full p-2 border rounded bg-white text-black "
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 ">
                  الفصل الدراسي
                </label>
                <input
                  type="text"
                  value={config.semester}
                  onChange={(e) =>
                    setConfig({ ...config, semester: e.target.value })
                  }
                  className="w-full p-2 border rounded bg-white text-black "
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 ">
                  المعلم
                </label>
                <input
                  type="text"
                  value={config.teacher}
                  onChange={(e) =>
                    setConfig({ ...config, teacher: e.target.value })
                  }
                  className="w-full p-2 border rounded bg-white text-black "
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 ">
                  المادة
                </label>
                <input
                  list="subjects"
                  value={config.subject}
                  onChange={(e) =>
                    setConfig({ ...config, subject: e.target.value })
                  }
                  className="w-full p-2 border rounded bg-white text-black "
                />
                <datalist id="subjects">
                  {subjectsList.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 ">
                  الشهر/الفترة
                </label>
                <input
                  type="text"
                  value={config.month}
                  onChange={(e) =>
                    setConfig({ ...config, month: e.target.value })
                  }
                  className="w-full p-2 border rounded bg-white text-black "
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 ">
                  الصف
                </label>
                <select
                  value={config.grade}
                  onChange={(e) =>
                    setConfig({ ...config, grade: e.target.value })
                  }
                  className="w-full p-2 border rounded bg-white text-black "
                >
                  {gradesList.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 ">
                  الدرجة الكلية
                </label>
                <input
                  type="number"
                  value={config.totalMarks}
                  onChange={(e) =>
                    setConfig({ ...config, totalMarks: e.target.value })
                  }
                  className="w-full p-2 border rounded bg-white text-black "
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 ">
                  تعليمات الاختبار
                </label>
                <input
                  type="text"
                  value={config.instructions}
                  onChange={(e) =>
                    setConfig({ ...config, instructions: e.target.value })
                  }
                  className="w-full p-2 border rounded bg-white text-black "
                />
              </div>
            </div>

            {/* Question Types Selection */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 ">
              <h4 className="font-bold text-lg mb-3 text-gray-800 border-b pb-2">
                اختر أنواع الأسئلة، العدد، والموضع
              </h4>
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                {questionTypesList.map((type) => (
                  <div
                    key={type}
                    className={`flex flex-wrap items-center justify-between p-3 rounded border transition-all ${selectedQuestionTypes[type] ? "bg-blue-50 border-blue-300 shadow-sm" : "bg-white border-gray-200 "}`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-grow min-w-[200px]">
                      <input
                        type="checkbox"
                        checked={!!selectedQuestionTypes[type]}
                        onChange={() => handleTypeToggle(type)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-sm font-bold text-gray-800 ">
                        {type}
                      </span>
                    </label>

                    {selectedQuestionTypes[type] && (
                      <div className="flex gap-3 items-center mt-2 sm:mt-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">العدد:</span>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={selectedQuestionTypes[type].count}
                            onChange={(e) =>
                              handleTypeDetailsChange(
                                type,
                                "count",
                                e.target.value,
                              )
                            }
                            className="w-16 p-1 text-center border rounded text-sm bg-white text-black font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">الموضع:</span>
                          <select
                            value={selectedQuestionTypes[type].position}
                            onChange={(e) =>
                              handleTypeDetailsChange(
                                type,
                                "position",
                                e.target.value,
                              )
                            }
                            className="p-1 border rounded text-sm bg-white text-black font-bold"
                          >
                            {positions.map((pos) => (
                              <option key={pos.id} value={pos.id}>
                                {pos.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Instructions (New Field) */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                شروط إضافية للأسئلة (للذكاء الاصطناعي):
              </label>
              <textarea
                value={config.customInstructions}
                onChange={(e) =>
                  setConfig({ ...config, customInstructions: e.target.value })
                }
                placeholder="مثال: اجعل الأسئلة سهلة، ركز على الوحدة الأولى، لا تستخدم كلمات صعبة..."
                className="w-full p-2 border rounded bg-white text-black h-20 text-sm"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={handleStartCreation}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 text-lg"
              >
                ابدأ إنشاء الاختبار
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Actions */}
      {isGenerating ? (
        <div className="text-center p-10 bg-white rounded-xl shadow-lg border border-gray-200 mb-8 mx-auto max-w-lg">
          <i className="fas fa-cog fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-xl font-bold">
            جاري تفريغ الاختبار وتوزيع الأسئلة...
          </p>
        </div>
      ) : (
        <div className="flex justify-center gap-4 mb-8 no-print">
          <button
            onClick={handleExportExamPDF}
            disabled={isExporting}
            className="neumorphic-button bg-red-600 text-white px-6 py-3 font-bold rounded-xl shadow-md hover:bg-red-700 disabled:opacity-50"
          >
            {isExporting ? (
              <i className="fas fa-spinner fa-spin ml-2"></i>
            ) : (
              <i className="fas fa-file-pdf ml-2"></i>
            )}
            تصدير الاختبار (PDF)
          </button>
        </div>
      )}

      {/* THE EXAM PAPERS (2 A4 Pages Layout) */}
      <div
        className="flex justify-center overflow-x-auto mt-4"
        id="exam-export-container"
      >
        <div className="flex flex-col gap-8">
          {/* --- PAGE 1 --- */}
          <div
            id="exam-page-1"
            className="bg-white text-black shadow-lg mx-auto relative page-break overflow-hidden"
            style={{
              width: "210mm",
              height: "297mm",
              padding: "10mm",
              border: "1px solid #ccc",
              fontFamily: "'Times New Roman', serif",
              direction: "rtl",
              textAlign: "right",
              color: "#000000",
              fontSize: "12pt",
              position: "relative",
            }}
          >
            {/* Header Table (Page 1) */}
            <div className="border-b-2 border-double border-black pb-2 mb-2">
              <table className="w-full text-center font-bold">
                <tbody>
                  <tr>
                    <td className="w-1/3 align-top text-right pr-2">
                      <p className="text-black ">الجمهورية اليمنية</p>
                      <p className="text-black ">
                        {safeString(config.ministry)}
                      </p>
                      <p className="text-black ">
                        مكتب التربية والتعليم بالأمانة
                      </p>
                      <div
                        contentEditable
                        suppressContentEditableWarning={true}
                        className="whitespace-nowrap outline-none text-black "
                      >
                        المنطقة التعليمية: {safeString(config.district)}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning={true}
                        className="whitespace-nowrap outline-none text-black "
                      >
                        مدارس: {safeString(config.school)}
                      </div>
                    </td>
                    <td className="w-1/3 align-middle">
                      {/* Fix Image Loading Error with onError and crossOrigin */}
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Emblem_of_Yemen.svg/200px-Emblem_of_Yemen.svg.png"
                        alt="Logo"
                        className="h-20 mx-auto object-contain"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div
                        contentEditable
                        suppressContentEditableWarning={true}
                        className="mt-1 border border-black px-2 py-1 inline-block text-sm outline-none text-black "
                      >
                        اختبار مادة {safeString(config.subject)}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning={true}
                        className="text-xs mt-1 outline-none text-black "
                      >
                        شهر {safeString(config.month)} للفصل{" "}
                        {safeString(config.semester)}
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning={true}
                        className="text-xs outline-none text-black "
                      >
                        للعام الدراسي {safeString(config.year)}
                      </div>
                    </td>
                    <td className="w-1/3 align-top text-left pl-2">
                      <div className="flex justify-end gap-1">
                        <span className="text-black ">التاريخ:</span>{" "}
                        <div
                          contentEditable
                          suppressContentEditableWarning={true}
                          className="border-b border-black w-24 text-center outline-none text-black "
                        >
                          {config.date}
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 mt-1">
                        <span className="text-black ">المادة:</span>{" "}
                        <div
                          contentEditable
                          suppressContentEditableWarning={true}
                          className="border-b border-black w-24 text-center outline-none text-black "
                        >
                          {config.subject}
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 mt-1">
                        <span className="text-black ">الصف:</span>{" "}
                        <div
                          contentEditable
                          suppressContentEditableWarning={true}
                          className="border-b border-black w-24 text-center outline-none text-black "
                        >
                          {config.grade}
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 mt-1">
                        <span className="text-black ">النموذج:</span>{" "}
                        <div
                          contentEditable
                          suppressContentEditableWarning={true}
                          className="border-b border-black w-24 text-center outline-none text-black "
                        >
                          {config.model}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Student Name Strip */}
              <div className="border-t-2 border-black mt-2 pt-1 flex justify-between items-center text-sm font-bold bg-gray-100 px-2 text-black ">
                <div className="flex gap-2 w-1/2">
                  <span className="text-black ">الاسم:</span>{" "}
                  <div
                    contentEditable
                    suppressContentEditableWarning={true}
                    className="border-b border-dotted border-black flex-grow outline-none text-black "
                  ></div>
                </div>
                <div className="flex gap-2">
                  <span className="text-black ">الشعبة:</span>{" "}
                  <div
                    contentEditable
                    suppressContentEditableWarning={true}
                    className="border-b border-dotted border-black w-10 outline-none text-black "
                  ></div>
                </div>
                <div className="flex gap-2">
                  <span className="text-black ">رقم الجلوس:</span>{" "}
                  <div
                    contentEditable
                    suppressContentEditableWarning={true}
                    className="border-b border-dotted border-black w-16 outline-none text-black "
                  ></div>
                </div>
                <div className="flex gap-2">
                  <span className="text-black ">الرقم السري:</span>{" "}
                  <div
                    contentEditable
                    suppressContentEditableWarning={true}
                    className="border-b border-dotted border-black w-12 outline-none text-black "
                  ></div>
                </div>
              </div>
            </div>

            <div className="text-center font-bold mb-2 border-b border-black pb-1 bg-gray-50 text-black ">
              {safeString(config.instructions)}
            </div>

            {/* Q1 & Q2 */}
            {[
              { key: "q1", label: "السؤال الأول" },
              { key: "q2", label: "السؤال الثاني" },
            ].map((section, idx) => (
              <div key={idx} className="mb-4 border border-black relative">
                <div className="bg-gray-200 text-center font-bold border-b border-black py-1 text-sm text-black ">
                  <div
                    contentEditable
                    suppressContentEditableWarning={true}
                    onBlur={(e) => {
                      const v = e.currentTarget.innerText;
                      handleExamChange(section.key, "title", v);
                    }}
                    className="outline-none inline-block text-black font-black text-base"
                  >
                    {
                      (
                        renderedExam[
                          section.key as keyof typeof renderedExam
                        ] as any
                      ).title
                    }
                  </div>
                </div>
                <div className="flex">
                  <div className="w-10 border-l border-black flex items-center justify-center font-bold bg-gray-50 text-sm text-black ">
                    <div
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const v = e.currentTarget.innerText;
                        handleExamChange("gradingTable", section.key, v);
                      }}
                      className="outline-none text-black "
                    >
                      {
                        renderedExam.gradingTable[
                          section.key as keyof typeof renderedExam.gradingTable
                        ]
                      }
                    </div>
                  </div>
                  <div className="flex-grow p-2 overflow-hidden">
                    <div
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const v = e.currentTarget.innerText;
                        handleExamChange(section.key, "content", v);
                      }}
                      className="whitespace-pre-wrap outline-none mb-1 text-sm leading-relaxed text-black font-bold break-words w-full"
                      dangerouslySetInnerHTML={{
                        __html: (
                          renderedExam[
                            section.key as keyof typeof renderedExam
                          ] as any
                        ).content.replace(/^\n+/, ""),
                      }}
                    ></div>
                    <div className="space-y-1 mt-1">
                      {(
                        renderedExam[
                          section.key as keyof typeof renderedExam
                        ] as any
                      ).subQuestions.map((subQ: string, subIdx: number) => (
                        <div
                          key={subIdx}
                          className="flex gap-1 items-start w-full"
                        >
                          <div
                            contentEditable
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              const v = e.currentTarget.innerText;
                              handleExamChange(
                                section.key,
                                "subQuestions",
                                v,
                                subIdx,
                              );
                            }}
                            className="w-full outline-none min-h-[20px] text-black leading-tight whitespace-pre-wrap break-words"
                            dangerouslySetInnerHTML={{
                              __html: subQ.replace(/^\n+/, ""),
                            }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Page 1 Footer */}
            <div className="absolute bottom-10 left-0 w-full text-center font-bold italic text-black ">
              للأسئلة بقية خلف الورقة
            </div>
          </div>

          {/* --- PAGE 2 --- */}
          <div
            id="exam-page-2"
            className="bg-white text-black shadow-lg mx-auto relative page-break overflow-hidden"
            style={{
              width: "210mm",
              height: "297mm",
              padding: "10mm",
              border: "1px solid #ccc",
              fontFamily: "'Times New Roman', serif",
              direction: "rtl",
              textAlign: "right",
              color: "#000000",
              fontSize: "12pt",
              position: "relative",
            }}
          >
            {/* Header (Page 2 - Brief) */}
            <div className="border-b-2 border-black pb-2 mb-4 flex justify-between font-bold text-sm text-black ">
              <div>تابع اختبار مادة: {safeString(config.subject)}</div>
              <div>للصف: {safeString(config.grade)}</div>
              <div>للعام الدراسي: {safeString(config.year)}</div>
            </div>

            {/* Q3, Q4, Q5 */}
            {[
              { key: "q3", label: "السؤال الثالث" },
              { key: "q4", label: "السؤال الرابع" },
              { key: "q5", label: "السؤال الخامس" },
            ].map((section, idx) => (
              <div key={idx} className="mb-4 border border-black relative">
                <div className="bg-gray-200 text-center font-bold border-b border-black py-1 text-sm text-black ">
                  <div
                    contentEditable
                    suppressContentEditableWarning={true}
                    onBlur={(e) => {
                      const v = e.currentTarget.innerText;
                      handleExamChange(section.key, "title", v);
                    }}
                    className="outline-none inline-block text-black font-black text-base"
                  >
                    {
                      (
                        renderedExam[
                          section.key as keyof typeof renderedExam
                        ] as any
                      ).title
                    }
                  </div>
                </div>
                <div className="flex">
                  <div className="w-10 border-l border-black flex items-center justify-center font-bold bg-gray-50 text-sm text-black ">
                    <div
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const v = e.currentTarget.innerText;
                        handleExamChange("gradingTable", section.key, v);
                      }}
                      className="outline-none text-black "
                    >
                      {
                        renderedExam.gradingTable[
                          section.key as keyof typeof renderedExam.gradingTable
                        ]
                      }
                    </div>
                  </div>
                  <div className="flex-grow p-2 overflow-hidden">
                    <div
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const v = e.currentTarget.innerText;
                        handleExamChange(section.key, "content", v);
                      }}
                      className="whitespace-pre-wrap outline-none mb-1 text-sm leading-relaxed text-black font-bold break-words w-full"
                      dangerouslySetInnerHTML={{
                        __html: (
                          renderedExam[
                            section.key as keyof typeof renderedExam
                          ] as any
                        ).content.replace(/^\n+/, ""),
                      }}
                    ></div>
                    <div className="space-y-1 mt-1">
                      {(
                        renderedExam[
                          section.key as keyof typeof renderedExam
                        ] as any
                      ).subQuestions.map((subQ: string, subIdx: number) => (
                        <div
                          key={subIdx}
                          className="flex gap-1 items-start w-full"
                        >
                          <div
                            contentEditable
                            suppressContentEditableWarning={true}
                            onBlur={(e) => {
                              const v = e.currentTarget.innerText;
                              handleExamChange(
                                section.key,
                                "subQuestions",
                                v,
                                subIdx,
                              );
                            }}
                            className="w-full outline-none min-h-[20px] text-black leading-tight whitespace-pre-wrap break-words"
                            dangerouslySetInnerHTML={{
                              __html: subQ.replace(/^\n+/, ""),
                            }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Grading Table */}
            <div className="mt-6 border-2 border-black">
              <table className="w-full text-center border-collapse text-xs font-bold text-black ">
                <thead>
                  <tr className="bg-gray-200 ">
                    <td className="border border-black p-1 text-black ">
                      رقم السؤال
                    </td>
                    <td className="border border-black p-1 text-black ">
                      الأول
                    </td>
                    <td className="border border-black p-1 text-black ">
                      الثاني
                    </td>
                    <td className="border border-black p-1 text-black ">
                      الثالث
                    </td>
                    <td className="border border-black p-1 text-black ">
                      الرابع
                    </td>
                    <td className="border border-black p-1 text-black ">
                      الخامس
                    </td>
                    <td className="border border-black p-1 text-black ">
                      المجموع
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-1 bg-gray-50 text-black ">
                      الدرجة النهائية
                    </td>
                    <td className="border border-black p-1 text-black ">
                      {renderedExam.gradingTable.q1}
                    </td>
                    <td className="border border-black p-1 text-black ">
                      {renderedExam.gradingTable.q2}
                    </td>
                    <td className="border border-black p-1 text-black ">
                      {renderedExam.gradingTable.q3}
                    </td>
                    <td className="border border-black p-1 text-black ">
                      {renderedExam.gradingTable.q4}
                    </td>
                    <td className="border border-black p-1 text-black ">
                      {renderedExam.gradingTable.q5}
                    </td>
                    <td className="border border-black p-1 text-black ">
                      {renderedExam.gradingTable.total}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1 bg-gray-50 text-black ">
                      الدرجة المستحقة
                    </td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Signatures */}
            <div className="flex justify-between items-center p-4 mt-4 border-t-2 border-black text-black font-bold">
              <div>تمت الأسئلة مع خالص دعائنا لكم بالتوفيق والنجاح</div>
              <div>معلم المادة / أ. {safeString(config.teacher)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamFromContent;
