
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CHORD_DATA, KEYS } from './constants';
import { ChordCellData, FunctionCategory, ChordSubstitution, ChordVoicing, Language, ChordAnalysis } from './types';
import { TRANSLATIONS, LANGUAGE_LABELS } from './translations';
import { ChordCell } from './components/ChordCell';
import { explainChordFunction, getChordSubstitutions, getChordVoicing } from './services/geminiService';
import { getChordSemicones, getIntervalNames, playChordFromName, transposeNote, getChordData } from './utils/music';
import { ProgressionAssistant } from './components/ProgressionAssistant';
import { ChordDiagram } from './components/ChordDiagram';
import { KeyboardDiagram } from './components/KeyboardDiagram';
import { StaffNotation } from './components/StaffNotation';
import { Sparkles, X, Wand2, ChevronDown, ChevronUp, Piano, Info, Search, ArrowUp, ArrowDown, Music, Gauge, ArrowRightLeft, PlayCircle, Plus, Loader2, CircleDot, Guitar, Globe, Reply, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [currentKey, setCurrentKey] = useState(0); // Default C
  const [searchQuery, setSearchQuery] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5, 1, 1.5
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  // Enhanced Modal Content
  const [modalContent, setModalContent] = useState<{
    title: string;
    subtitle: string;
    category?: string;
    intervals: string[];
    semitones: number[]; 
    rootOffset: number; 
    analysis: ChordAnalysis | null;
    substitutions?: ChordSubstitution[];
    voicing?: ChordVoicing | null;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantInitialChord, setAssistantInitialChord] = useState<string>("");
  const [transposeFeedback, setTransposeFeedback] = useState<{direction: 'up' | 'down', label: string} | null>(null);

  const t = TRANSLATIONS[language];

  const handleInfo = async (chordName: string, context: string, cellData: ChordCellData) => {
    const keyLabel = KEYS.find(k => k.value === currentKey)?.label || 'C';
    const semitones = getChordSemicones("", cellData.quality);
    const tonalChord = getChordData(chordName);
    const intervals = tonalChord.empty ? getIntervalNames(semitones) : tonalChord.intervals;

    let category = "";
    if (cellData.category !== FunctionCategory.None) {
       // Map category for display
       const catMap: Record<string, string> = {
          [FunctionCategory.SecondaryDominant]: t['cat.sec.full'],
          [FunctionCategory.TritoneSub]: t['cat.sub.full'],
          [FunctionCategory.ModalInterchange]: t['cat.mod.full'],
          [FunctionCategory.DiminishedSub]: t['cat.dim.full'],
       };
       category = catMap[cellData.category] || cellData.category;
    }

    setModalContent({
      title: chordName,
      subtitle: `${context} in ${keyLabel} Major`,
      category,
      intervals,
      semitones,
      rootOffset: cellData.rootOffset,
      analysis: null,
      substitutions: [],
      voicing: null
    });
    
    setIsLoading(true);
    try {
      const [analysisResult, substitutions, voicing] = await Promise.all([
        explainChordFunction(chordName, keyLabel, context, language),
        getChordSubstitutions(chordName, keyLabel, context, language),
        getChordVoicing(chordName)
      ]);
      
      setModalContent(prev => prev ? { ...prev, analysis: analysisResult, substitutions, voicing } : null);
    } catch (e) {
      setModalContent(prev => prev ? { ...prev, analysis: null } : null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggest = (chord: string) => {
    setAssistantInitialChord(chord);
    setShowAssistant(true);
  };

  const handleTranspose = (semitones: number) => {
    setCurrentKey((prev) => {
      let newKey = (prev + semitones) % 12;
      if (newKey < 0) newKey += 12;
      return newKey;
    });

    setTransposeFeedback({
      direction: semitones > 0 ? 'up' : 'down',
      label: semitones > 0 ? t['transpose.up'] : t['transpose.down']
    });

    setTimeout(() => {
      setTransposeFeedback(null);
    }, 800);
  };

  const handleAddToPlaylist = (chord: string) => {
    setPlaylist(prev => [...prev, chord]);
  };

  const handleRemoveFromPlaylist = (index: number) => {
    setPlaylist(prev => prev.filter((_, i) => i !== index));
  };

  const toggleLanguage = (lang: Language) => {
    setLanguage(lang);
    setShowLangMenu(false);
  }

  const keyLabel = KEYS.find(k => k.value === currentKey)?.label || 'C';

  const getAbsoluteRootIndex = (rootOffset: number) => {
    return (currentKey + rootOffset) % 12;
  };

  // Helper to translate column headers dynamically
  const getColumnDisplay = (colId: string) => {
     if (colId === 'iv') return { label: t['col.iv.label'], degree: t['col.iv.degree'], desc: t['col.iv.desc'] };
     if (colId === 'v') return { label: t['col.v.label'], degree: t['col.v.degree'], desc: t['col.v.desc'] };
     if (colId === 'iii') return { label: t['col.iii.label'], degree: t['col.iii.degree'], desc: t['col.iii.desc'] };
     if (colId === 'pass1') return { label: t['col.pass.label'], degree: t['col.pass1.degree'], desc: t['col.pass1.desc'] };
     if (colId === 'pass2') return { label: t['col.pass.label'], degree: t['col.pass2.degree'], desc: t['col.pass2.desc'] };
     if (colId === 'vi') return { label: t['col.vi.label'], degree: t['col.vi.degree'], desc: t['col.vi.desc'] };
     return { label: '', degree: '', desc: '' };
  };

  const todayDate = new Date().toLocaleDateString();

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden relative">
      
      {/* Feedback Toast - Fixed positioning to appear above everything */}
      {transposeFeedback && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-bold tracking-wide shadow-xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
          {transposeFeedback.label}
        </div>
      )}
      
      {/* 1. APP HEADER - Modern Glass */}
      <header className="flex-none bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 h-16 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl text-white shadow-lg shadow-slate-900/20">
             <span className="font-logo text-2xl tracking-widest translate-y-[1px]">SSA</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-xl tracking-tight text-slate-900 leading-none">{t['app.title']}</h1>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{t['app.subtitle']}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Search Bar */}
           <div className="relative group hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder={t['search.placeholder']}
              className="bg-slate-100 border-none text-sm rounded-full py-1.5 pl-9 pr-4 w-40 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none text-slate-600 placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Controls Group */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200/60">
            {/* Key Selector */}
            <div className="relative flex items-center px-2">
              <span className="text-[10px] font-bold text-slate-400 mr-2 uppercase tracking-wider">Key</span>
              <div className="w-16 text-center font-bold text-slate-700">{keyLabel}</div>
            </div>
            
            <div className="w-px h-4 bg-slate-200 mx-1"></div>

            {/* Transpose Buttons */}
            <div className="flex gap-0.5">
               <button onClick={() => handleTranspose(-1)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-md transition-all text-slate-500" title={t['transpose.down']}>
                  <ArrowDown size={14} strokeWidth={2.5} />
               </button>
               <button onClick={() => handleTranspose(1)} className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-md transition-all text-slate-500" title={t['transpose.up']}>
                  <ArrowUp size={14} strokeWidth={2.5} />
               </button>
            </div>
          </div>
          
          {/* Speed Toggle */}
          <button 
             onClick={() => setPlaybackSpeed(s => s === 1 ? 0.5 : (s === 0.5 ? 2 : 1))}
             className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors min-w-[70px] justify-center"
             title="Playback Speed"
          >
             <Gauge size={14} />
             <span>{playbackSpeed}x</span>
          </button>

          {/* Language Toggle */}
          <div className="relative z-40">
             <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
                <Globe size={18} />
             </button>
             {showLangMenu && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[60] py-1">
                   {(Object.keys(LANGUAGE_LABELS) as Language[]).map(lang => (
                      <button 
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${language === lang ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600'}`}
                      >
                         {LANGUAGE_LABELS[lang]}
                      </button>
                   ))}
                </div>
             )}
          </div>
          
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* AI Assistant Button */}
          <button 
             onClick={() => setShowAssistant(true)}
             className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-slate-900/10 hover:shadow-lg hover:shadow-slate-900/20 group"
          >
             <Sparkles size={14} className="group-hover:animate-pulse text-yellow-300" />
             <span className="text-xs font-bold tracking-wide">{t['ai.assistant']}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT - Interactive Grid */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50/50 relative app-scroll">
         
         <div className="flex h-full min-w-max p-6 gap-4">
            {CHORD_DATA.map((col) => {
               const { label, degree, desc } = getColumnDisplay(col.id);

               return (
                  <div key={col.id} className={`flex-shrink-0 w-64 flex flex-col rounded-2xl border border-slate-200/60 shadow-sm ${col.color} overflow-hidden transition-all duration-300 hover:shadow-md`}>
                     {/* Column Header */}
                     <div className="p-4 border-b border-slate-100 bg-white/50 sticky top-0 z-0">
                        <div className="flex justify-between items-baseline mb-1">
                           <h2 className="text-2xl font-serif font-bold text-slate-800">{label}</h2>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{degree}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{desc}</p>
                     </div>
                     
                     {/* Cells Container */}
                     <div className="p-3 overflow-y-auto flex-1 custom-scrollbar space-y-2">
                        {col.cells.map((cell, idx) => {
                           if (!cell) return <div key={idx} className="h-4 border-b border-dashed border-slate-200/50 mx-2" />;
                           return (
                              <ChordCell 
                                 key={`${cell.rootOffset}-${cell.quality}-${idx}`}
                                 data={cell}
                                 currentKey={currentKey}
                                 keyLabel={keyLabel}
                                 columnContext={label}
                                 onInfo={handleInfo}
                                 onSuggest={handleSuggest}
                                 searchQuery={searchQuery}
                                 playbackSpeed={playbackSpeed}
                                 language={language}
                              />
                           );
                        })}
                     </div>
                  </div>
               )
            })}
            
            {/* End Spacer */}
            <div className="w-12"></div>
         </div>
      </main>

      {/* 3. MODERN MODAL - Using Portal to render outside component tree, appearing from bottom */}
      {modalContent && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setModalContent(null)}
        >
          <div 
            className="bg-white rounded-t-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col ring-1 ring-white/20 slide-in-from-bottom"
            style={{ marginBottom: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                 <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">{modalContent.title}</h2>
                    <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-md tracking-wider uppercase">
                       {modalContent.subtitle}
                    </span>
                 </div>
                 {modalContent.category && (
                    <div className="flex items-center gap-2 text-indigo-600">
                       <ArrowRightLeft size={14} />
                       <span className="text-xs font-bold uppercase tracking-widest">{modalContent.category}</span>
                    </div>
                 )}
              </div>
              <button 
                onClick={() => setModalContent(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 bg-white">
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Visuals */}
                  <div className="lg:col-span-1 space-y-6">
                     
                     {/* Guitar Voicing */}
                     <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-4 text-slate-400 w-full">
                           <Guitar size={14} />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{t['modal.voicing']}</span>
                        </div>
                        {modalContent.voicing ? (
                           <ChordDiagram voicing={modalContent.voicing} />
                        ) : (
                           <div className="h-[180px] w-full flex items-center justify-center text-slate-300">
                              {isLoading ? <Loader2 className="animate-spin" /> : <Guitar size={32} opacity={0.2} />}
                           </div>
                        )}
                     </div>

                     {/* Keyboard Structure */}
                     <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                           <Piano size={14} />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{t['modal.keyboard']}</span>
                        </div>
                        <div className="overflow-x-auto pb-2">
                          <KeyboardDiagram rootNoteIndex={getAbsoluteRootIndex(modalContent.rootOffset)} intervals={modalContent.semitones} />
                        </div>
                     </div>

                  </div>

                  {/* Middle & Right: Theory & Analysis */}
                  <div className="lg:col-span-2 space-y-8">
                     
                     {/* Notation */}
                     <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                           <Music size={14} />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{t['modal.notation']}</span>
                        </div>
                        <div className="h-24 flex items-center justify-center overflow-hidden">
                           <StaffNotation chordName={modalContent.title} />
                        </div>
                     </div>

                     {/* AI Explanation - NEW DESIGN */}
                     <div>
                        <div className="flex items-center gap-2 mb-3 text-indigo-600">
                           <Sparkles size={16} />
                           <h3 className="text-sm font-bold uppercase tracking-widest">{t['modal.analysis']}</h3>
                        </div>
                        
                        {/* Dark Comment Card Container */}
                        <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden ring-1 ring-white/10">
                           
                           {/* Loading State */}
                           {isLoading && !modalContent.analysis ? (
                              <div className="flex flex-col items-center justify-center py-12 gap-3 text-indigo-400">
                                 <Loader2 size={24} className="animate-spin" />
                                 <span className="italic text-sm">{t['modal.analyzing']}</span>
                              </div>
                           ) : modalContent.analysis ? (
                              <>
                                 {/* Card Header */}
                                 <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-indigo-500/20">AI</div>
                                       <div>
                                          <div className="text-sm font-bold text-blue-400">{t['analysis.aiName']}</div>
                                          <div className="text-[10px] text-slate-500 font-medium">{todayDate}</div>
                                       </div>
                                    </div>
                                 </div>

                                 {/* Card Body */}
                                 <div className="space-y-5 text-[13px] leading-relaxed text-slate-300">
                                    {/* Usage */}
                                    <div>
                                       <span className="font-bold text-white block mb-1.5 text-sm">{t['analysis.usage']} :</span>
                                       <p className="opacity-90">{modalContent.analysis.usage}</p>
                                    </div>
                                    
                                    {/* Feeling */}
                                    <div>
                                       <span className="font-bold text-white block mb-1.5 text-sm">{t['analysis.feeling']} :</span>
                                       <p className="opacity-90">{modalContent.analysis.feeling}</p>
                                    </div>

                                    {/* Common Substitutions (Displayed inside AI Card for context) */}
                                    {modalContent.substitutions && modalContent.substitutions.length > 0 && (
                                       <div className="mt-6 pt-4 border-t border-slate-800">
                                           <span className="font-bold text-white block mb-3 text-sm">{t['modal.subs']} :</span>
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                              {modalContent.substitutions.map((sub, i) => (
                                                  <div key={i} className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-lg border border-white/5">
                                                      <div className="flex justify-between items-baseline mb-1">
                                                          <span className="font-bold text-indigo-300 text-sm">{sub.chord}</span>
                                                          <span className="text-[10px] font-mono opacity-50">{sub.romanNumeral}</span>
                                                      </div>
                                                      <p className="text-[11px] text-slate-400 leading-tight">{sub.description}</p>
                                                  </div>
                                              ))}
                                           </div>
                                       </div>
                                    )}
                                 </div>
                              </>
                           ) : null}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Progression Assistant Modal */}
      <ProgressionAssistant 
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
        currentKey={currentKey}
        keyLabel={keyLabel}
        columns={CHORD_DATA}
        initialChord={assistantInitialChord}
        playbackSpeed={playbackSpeed}
        playlist={playlist}
        onAddToPlaylist={handleAddToPlaylist}
        onRemoveFromPlaylist={handleRemoveFromPlaylist}
        language={language}
      />

    </div>
  );
}

export default App;
