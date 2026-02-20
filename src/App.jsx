import React, { useState, useEffect } from 'react';

// --- 3D Helper Components ---

const Box3D = ({ w, h, d, color, z = 0, x = 0, y = 0, rotX = 0, rotY = 0, rotZ = 0, origin = '50% 50%', frontStyle = {}, backStyle = {}, children }) => {
  const upvcBevel = 'inset 0 0 8px rgba(0,0,0,0.15), inset 0 0 2px rgba(255,255,255,0.4)';
  return (
    <div className="absolute shadow-sm" style={{
      width: w, height: h, left: x, top: y,
      transformOrigin: origin,
      transform: `translateZ(${z}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
      transformStyle: 'preserve-3d',
      transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden"
           style={{ backgroundColor: color, transform: `translateZ(${d / 2}px)`, boxShadow: upvcBevel, ...frontStyle }}>
        {children}
      </div>
      <div className="absolute inset-0"
           style={{ backgroundColor: color, transform: `translateZ(${-d / 2}px) rotateY(180deg)`, filter: 'brightness(0.85)', boxShadow: upvcBevel, ...backStyle }}></div>

      {d > 0 && (
        <>
          <div className="absolute left-0 top-0 h-full"
               style={{ width: d, backgroundColor: color, transformOrigin: 'left', transform: `translateZ(${d / 2}px) rotateY(-90deg)`, filter: 'brightness(0.7)', boxShadow: upvcBevel }}></div>
          <div className="absolute right-0 top-0 h-full"
               style={{ width: d, backgroundColor: color, transformOrigin: 'right', transform: `translateZ(${d / 2}px) rotateY(90deg)`, filter: 'brightness(0.7)', boxShadow: upvcBevel }}></div>
          <div className="absolute top-0 left-0 w-full"
               style={{ height: d, backgroundColor: color, transformOrigin: 'top', transform: `translateZ(${d / 2}px) rotateX(90deg)`, filter: 'brightness(0.95)', boxShadow: upvcBevel }}></div>
          <div className="absolute bottom-0 left-0 w-full"
               style={{ height: d, backgroundColor: color, transformOrigin: 'bottom', transform: `translateZ(${d / 2}px) rotateX(-90deg)`, filter: 'brightness(0.5)', boxShadow: upvcBevel }}></div>
        </>
      )}
    </div>
  );
};

const Frame3D = ({ w, h, thickness, depth, color, z = 0, frontStyle = {} }) => (
  <div style={{ transform: `translateZ(${z}px)`, transformStyle: 'preserve-3d', position: 'absolute', top: 0, left: 0, width: w, height: h }}>
    <Box3D w={w} h={thickness} d={depth} color={color} x={0} y={0} origin="top left" frontStyle={frontStyle} />
    <Box3D w={w} h={thickness} d={depth} color={color} x={0} y={h - thickness} origin="top left" frontStyle={frontStyle} />
    <Box3D w={thickness} h={h - 2 * thickness} d={depth} color={color} x={0} y={thickness} origin="top left" frontStyle={frontStyle} />
    <Box3D w={thickness} h={h - 2 * thickness} d={depth} color={color} x={w - thickness} y={thickness} origin="top left" frontStyle={frontStyle} />
  </div>
);

// --- Main App Component ---

const App = () => {
  const [selectedItem, setSelectedItem] = useState('bathroom_win');
  const [profileColor, setProfileColor] = useState('white');
  const [isOpen, setIsOpen] = useState(false);
  const [showTape, setShowTape] = useState(true);

  const [rotation, setRotation] = useState({ x: -10, y: -25 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] = useState('rotate');
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiTitle, setAiTitle] = useState('');

  useEffect(() => {
    setRotation({ x: -10, y: -25 });
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsOpen(false);
  }, [selectedItem]);

  const handleStart = (clientX, clientY) => {
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
  };
  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startPos.x;
    const dy = clientY - startPos.y;

    if (interactionMode === 'rotate') {
      setRotation(prev => ({
        x: Math.max(-90, Math.min(90, prev.x - dy * 0.8)),
        y: prev.y + dx * 0.8
      }));
    } else {
      setPan(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
    }

    setStartPos({ x: clientX, y: clientY });
  };
  const handleEnd = () => setIsDragging(false);

  const handleWheel = (e) => {
    setZoom(prev => Math.max(0.5, Math.min(2.5, prev - e.deltaY * 0.002)));
  };

  const callGeminiAPI = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      return 'يرجى إضافة مفتاح Gemini API في ملف .env كالتالي: VITE_GEMINI_API_KEY=your_key';
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: "أنت مهندس استشاري متخصص في قطاعات الـ UPVC والألوميتال في مصر. أسلوبك احترافي، دقيق، ومفيد للعميل الذي يجهز شقته. تستخدم تنسيق النقاط لسهولة القراءة وتتجنب المقدمات الطويلة." }]
      }
    };

    const retries = 5;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من توليد النص. حاول مرة أخرى.";
      } catch (error) {
        if (i === retries - 1) {
          console.error("Gemini API Error:", error);
          return "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي بعد عدة محاولات. يرجى المحاولة لاحقاً.";
        }
        await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
      }
    }
  };

  const handleGenerateQuotation = async () => {
    setAiTitle('✨ بند مقايسة فني (Quotation)');
    setAiModalOpen(true);
    setAiLoading(true);
    setAiContent('');

    const itemName = menuItems[selectedItem];
    const colorName = profileColor === 'white' ? 'أبيض ناصع' : 'بيج شامبين';

    const prompt = `أريد كتابة بند مقايسة فني احترافي (بأسلوب المهندسين والمقاولين في مصر) لتوريد وتركيب ${itemName} مصنوع من قطاع UPVC ماركة KOMPEN التركية، واللون ${colorName}.
    اذكر المواصفات الفنية كجودة الإكسسوارات، ونوع الزجاج (دبل للريسبشن أو مسنفر للحمامات والمطابخ)، ووجود سلك مانع للحشرات.
    اكتب البند في نقاط واضحة وجاهزة للنسخ واللصق في عقد الاتفاق مع الفني لضمان حق العميل.`;

    const result = await callGeminiAPI(prompt);
    setAiContent(result);
    setAiLoading(false);
  };

  const handleAskExpert = async () => {
    setAiTitle('✨ رأي الخبير الهندسي');
    setAiModalOpen(true);
    setAiLoading(true);
    setAiContent('');

    const itemName = menuItems[selectedItem];
    const colorName = profileColor === 'white' ? 'أبيض ناصع' : 'بيج شامبين';

    const prompt = `بصفتك خبير في شبابيك وأبواب الـ UPVC، العميل اختار ${itemName} بقطاع KOMPEN التركي ولون ${colorName}.
    ما هي أهم 3 مميزات لهذا الاختيار تحديداً مقارنة بالألوميتال العادي (ركز على العزل، المتانة، وعملية هذا النوع من الفتح)؟
    وما هي أهم نصيحة للحفاظ على المفصلات والكاوتش (Rubber) لهذا العنصر تحديداً؟`;

    const result = await callGeminiAPI(prompt);
    setAiContent(result);
    setAiLoading(false);
  };

  const copyToClipboard = () => {
    const textArea = document.createElement("textarea");
    textArea.value = aiContent;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const isBeige = profileColor === 'beige';
  const colorHex = isBeige ? '#D1C7B7' : '#FFFFFF';

  const glassGasket = '4px solid #1a1a1a';
  const handleColor = "#e4e4e7";
  const handleStyle = {
    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 100%)',
    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.6)'
  };

  const meshPattern = {
    backgroundImage: `
      linear-gradient(to right, rgba(20,20,20,0.8) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(20,20,20,0.8) 1px, transparent 1px)
    `,
    backgroundSize: '3px 3px',
    backgroundColor: 'rgba(0,0,0,0.1)',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
  };

  const frostedGlassStyle = {
    backgroundColor: 'rgba(230, 230, 230, 0.4)',
    backdropFilter: 'blur(12px)',
    border: glassGasket,
    backgroundImage: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 35%, rgba(255,255,255,0.8) 38%, transparent 40%)',
    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.3)'
  };

  const receptionGlassStyle = {
    backgroundColor: isBeige ? 'rgba(90, 50, 20, 0.35)' : 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(8px)',
    backgroundImage: `
      linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.7) 28%, transparent 30%, transparent 45%, rgba(255,255,255,0.3) 48%, transparent 50%),
      ${isBeige ? 'radial-gradient(rgba(0,0,0,0.3) 1px, transparent 1px)' : 'radial-gradient(rgba(200,200,200,0.5) 1px, transparent 1px)'}
    `,
    backgroundSize: '100% 100%, 5px 5px',
    border: glassGasket,
    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.3)'
  };

  const panelBg = {
    backgroundImage: isBeige
      ? 'repeating-linear-gradient(to bottom, #D1C7B7, #D1C7B7 20px, #b4a28f 21px, #b4a28f 23px)'
      : 'repeating-linear-gradient(to bottom, #FFFFFF, #FFFFFF 20px, #d4d4d8 21px, #d4d4d8 23px)',
    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.15)'
  };

  const svgTape = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="40" viewBox="0 0 150 40"><text x="10" y="25" fill="${isBeige ? '#854d0e' : '#dc2626'}" font-family="sans-serif" font-weight="900" font-size="16" opacity="0.6" transform="rotate(-10 10 25)">KOMPEN UPVC</text></svg>`);
  const kompenTapeStyle = showTape ? {
    backgroundImage: `url("data:image/svg+xml;utf8,${svgTape}")`,
    backgroundSize: '150px 40px',
    backgroundColor: isBeige ? '#fde68a' : '#f8fafc'
  } : {};

  const renderModel = () => {
    switch (selectedItem) {

      case 'bathroom_win':
        return (
          <div style={{ width: 200, height: 250, transformStyle: 'preserve-3d', position: 'relative', transform: 'translate(-100px, -125px)' }}>
            <Frame3D w={200} h={250} thickness={20} depth={50} color={colorHex} frontStyle={kompenTapeStyle} />
            <Box3D w={160} h={210} d={1} color="transparent" x={20} y={20} z={-20} frontStyle={meshPattern} backStyle={meshPattern} />
            <div style={{
              position: 'absolute', left: 20, top: 20, width: 160, height: 210,
              transformOrigin: 'bottom',
              transform: `rotateX(${isOpen ? 25 : 0}deg)`,
              transition: 'transform 0.5s ease',
              transformStyle: 'preserve-3d'
            }}>
              <Frame3D w={160} h={210} thickness={16} depth={25} color={colorHex} />
              <Box3D w={128} h={178} d={2} color="transparent" x={16} y={16} z={0} frontStyle={frostedGlassStyle} backStyle={frostedGlassStyle} />
              <Box3D w={30} h={10} d={18} color={handleColor} x={65} y={10} z={12} frontStyle={handleStyle} backStyle={handleStyle} />
            </div>
          </div>
        );

      case 'kitchen_win':
        return (
          <div style={{ width: 300, height: 250, transformStyle: 'preserve-3d', position: 'relative', transform: 'translate(-150px, -125px)' }}>
            <Frame3D w={300} h={250} thickness={20} depth={50} color={colorHex} frontStyle={kompenTapeStyle} />
            <Box3D w={260} h={210} d={1} color="transparent" x={20} y={20} z={-20} frontStyle={meshPattern} backStyle={meshPattern} />
            <div style={{
              position: 'absolute', left: 20, top: 20, width: 130, height: 210,
              transformOrigin: 'left',
              transform: `rotateY(${isOpen ? 75 : 0}deg)`,
              transition: 'transform 0.6s ease',
              transformStyle: 'preserve-3d'
            }}>
              <Frame3D w={130} h={210} thickness={16} depth={25} color={colorHex} />
              <Box3D w={98} h={178} d={2} color="transparent" x={16} y={16} z={0} frontStyle={frostedGlassStyle} backStyle={frostedGlassStyle} />
              <Box3D w={10} h={35} d={15} color={handleColor} x={105} y={85} z={12} frontStyle={handleStyle} backStyle={handleStyle} />
            </div>
            <div style={{
              position: 'absolute', left: 150, top: 20, width: 130, height: 210,
              transformOrigin: 'right',
              transform: `rotateY(${isOpen ? -75 : 0}deg)`,
              transition: 'transform 0.6s ease',
              transformStyle: 'preserve-3d'
            }}>
              <Frame3D w={130} h={210} thickness={16} depth={25} color={colorHex} />
              <Box3D w={98} h={178} d={2} color="transparent" x={16} y={16} z={0} frontStyle={frostedGlassStyle} backStyle={frostedGlassStyle} />
              <Box3D w={10} h={35} d={15} color={handleColor} x={15} y={85} z={12} frontStyle={handleStyle} backStyle={handleStyle} />
            </div>
          </div>
        );

      case 'bathroom_door':
        return (
          <div style={{ width: 220, height: 400, transformStyle: 'preserve-3d', position: 'relative', transform: 'translate(-110px, -200px)' }}>
            <Box3D w={220} h={20} d={60} color={colorHex} x={0} y={0} origin="top left" frontStyle={kompenTapeStyle} />
            <Box3D w={20} h={380} d={60} color={colorHex} x={0} y={20} origin="top left" frontStyle={kompenTapeStyle} />
            <Box3D w={20} h={380} d={60} color={colorHex} x={200} y={20} origin="top left" frontStyle={kompenTapeStyle} />
            <div style={{
              position: 'absolute', left: 20, top: 20, width: 180, height: 378,
              transformOrigin: 'right',
              transform: `rotateY(${isOpen ? -80 : 0}deg)`,
              transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              transformStyle: 'preserve-3d'
            }}>
              <Box3D w={180} h={378} d={35} color={colorHex} x={0} y={0} z={0} frontStyle={panelBg} backStyle={panelBg} />
              <Box3D w={35} h={10} d={20} color={handleColor} x={15} y={185} z={25} frontStyle={handleStyle} backStyle={handleStyle} />
              <Box3D w={35} h={10} d={20} color={handleColor} x={15} y={185} z={-25} frontStyle={handleStyle} backStyle={handleStyle} />
            </div>
          </div>
        );

      case 'reception_win':
        return (
          <div style={{ width: 400, height: 250, transformStyle: 'preserve-3d', position: 'relative', transform: 'translate(-200px, -125px)' }}>
            <Frame3D w={400} h={250} thickness={20} depth={70} color={colorHex} frontStyle={kompenTapeStyle} />
            <Box3D w={185} h={210} d={2} color="#222" x={195} y={20} z={-15} frontStyle={meshPattern} backStyle={meshPattern} />
            <div style={{
              position: 'absolute', left: isOpen ? 20 : 195, top: 20, width: 185, height: 210,
              transition: 'left 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transformStyle: 'preserve-3d',
              transform: 'translateZ(-2px)'
            }}>
              <Frame3D w={185} h={210} thickness={16} depth={18} color={colorHex} />
              <Box3D w={153} h={178} d={4} color="transparent" x={16} y={16} z={0} frontStyle={receptionGlassStyle} backStyle={receptionGlassStyle} />
              <Box3D w={10} h={45} d={12} color={handleColor} x={15} y={85} z={10} frontStyle={handleStyle} backStyle={handleStyle} />
            </div>
            <div style={{
              position: 'absolute', left: isOpen ? 195 : 20, top: 20, width: 185, height: 210,
              transition: 'left 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transformStyle: 'preserve-3d',
              transform: 'translateZ(18px)'
            }}>
              <Frame3D w={185} h={210} thickness={16} depth={18} color={colorHex} />
              <Box3D w={153} h={178} d={4} color="transparent" x={16} y={16} z={0} frontStyle={receptionGlassStyle} backStyle={receptionGlassStyle} />
              <Box3D w={10} h={45} d={12} color={handleColor} x={160} y={85} z={10} frontStyle={handleStyle} backStyle={handleStyle} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const menuItems = {
    bathroom_win: 'شباك الحمام (قلاب)',
    kitchen_win: 'شباك المطبخ (مفصلي)',
    bathroom_door: 'باب الحمام (بانل)',
    reception_win: 'شباك الريسبشن (جرار)'
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans dir-rtl select-none" dir="rtl">

      <div className="bg-slate-950 p-4 border-b border-slate-800 text-center shadow-lg relative z-20">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
          المعاينة ثلاثية الأبعاد + المساعد الهندسي الذكي
        </h1>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">

        <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 p-5 flex flex-col gap-6 overflow-y-auto z-20 shadow-2xl">

          <div>
            <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              اختر العنصر:
            </h3>
            <div className="flex flex-col gap-2">
              {Object.keys(menuItems).map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedItem(key)}
                  className={`text-right p-3 rounded-lg transition-all font-medium border ${
                    selectedItem === key
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {menuItems[key]}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-800 w-full"></div>

          <div>
            <h3 className="text-slate-300 font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              لون قطاع الـ UPVC:
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setProfileColor('beige')}
                className={`flex-1 py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  profileColor === 'beige' ? 'bg-amber-900/30 border-amber-500/50 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-[#D1C7B7] border border-slate-500 shadow-inner"></div>
                <span className="text-xs">بيج شامبين</span>
              </button>
              <button
                onClick={() => setProfileColor('white')}
                className={`flex-1 py-2 px-1 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                  profileColor === 'white' ? 'bg-slate-100/10 border-slate-300/50 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white border border-slate-500 shadow-inner"></div>
                <span className="text-xs">أبيض ناصع</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showTape}
                onChange={(e) => setShowTape(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600 focus:ring-offset-slate-800"
              />
              <span className="text-sm text-slate-300 font-medium">إظهار شريط حماية KOMPEN</span>
            </label>
          </div>

          <div className="mt-auto p-4 bg-gradient-to-b from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl">
            <div className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2">
              <span>🤖</span> مساعدك الهندسي (الذكاء الاصطناعي)
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGenerateQuotation}
                className="w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-200 text-xs rounded-lg transition-all flex justify-between items-center"
              >
                <span>صياغة بند العقد والمقايسة</span>
                <span>✨</span>
              </button>
              <button
                onClick={handleAskExpert}
                className="w-full py-2 px-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 text-purple-200 text-xs rounded-lg transition-all flex justify-between items-center"
              >
                <span>استشارة المزايا والصيانة</span>
                <span>✨</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-slate-800 cursor-move touch-none"
             onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
             onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
             onMouseUp={handleEnd}
             onMouseLeave={handleEnd}
             onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
             onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
             onTouchEnd={handleEnd}
             onWheel={handleWheel}
             style={{ perspective: '1200px' }}>

          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className={`absolute top-6 right-6 z-30 px-6 py-3 rounded-full font-bold shadow-xl transition-all border-2 flex items-center gap-2 ${
              isOpen
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            {isOpen ? 'أغلق النافذة / الباب 🔒' : 'افتح النافذة / الباب 🔓'}
          </button>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex gap-1 bg-slate-900/80 p-2 rounded-xl backdrop-blur-md border border-slate-700 shadow-2xl">
            <button
              onClick={(e) => { e.stopPropagation(); setInteractionMode('rotate'); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${interactionMode === 'rotate' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              دوران 🔄
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setInteractionMode('pan'); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${interactionMode === 'pan' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              تحريك ✋
            </button>
            <div className="w-px bg-slate-700 mx-2 my-1"></div>
            <button
              onClick={(e) => { e.stopPropagation(); setRotation({x: -10, y: -25}); setZoom(1); setPan({x: 0, y: 0}); }}
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:bg-slate-700 transition-all flex items-center gap-2"
              title="إعادة ضبط الرؤية"
            >
              مركز 🎯
            </button>
          </div>

          <div className="absolute top-1/2 left-1/2 w-0 h-0" style={{ transformStyle: 'preserve-3d', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}>
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: 1000, height: 1000,
              transform: 'translate(-50%, -50%) rotateX(90deg) translateZ(-250px)',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              pointerEvents: 'none'
            }}></div>
            {renderModel()}
          </div>
        </div>
      </div>

      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/50 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h2 className="text-xl font-bold text-indigo-300">{aiTitle}</h2>
              <button onClick={() => setAiModalOpen(false)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-slate-300 leading-relaxed font-medium">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-indigo-400 animate-pulse">جاري تحليل المواصفات والتوليد باستخدام Gemini AI...</p>
                </div>
              ) : (
                <div className="space-y-4 whitespace-pre-wrap select-text">
                  {aiContent.split('\n').map((line, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                  ))}
                </div>
              )}
            </div>

            {!aiLoading && (
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/30 flex justify-end">
                <button
                  onClick={() => { copyToClipboard(); setAiModalOpen(false); }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-bold flex items-center gap-2"
                >
                  نسخ النص وإغلاق 📋
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
