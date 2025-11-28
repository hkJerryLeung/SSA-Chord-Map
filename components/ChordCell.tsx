
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChordCellData, ChordStyle, FunctionCategory, Language } from '../types';
import { transposeNote, playChord, getRomanNumeral, getChordSemicones } from '../utils/music';
import { TRANSLATIONS } from '../translations';
import { Info, ArrowRight, ArrowRightLeft, Globe, CircleDot, Play } from 'lucide-react';
import { KeyboardDiagram } from './KeyboardDiagram';

interface Props {
  data: ChordCellData;
  currentKey: number; // 0-11
  keyLabel: string;
  columnContext: string;
  onInfo: (chord: string, context: string, data: ChordCellData) => void;
  onSuggest: (chord: string) => void;
  searchQuery?: string;
  playbackSpeed: number;
  language: Language;
}

export const ChordCell: React.FC<Props> = ({ 
  data, 
  currentKey, 
  keyLabel, 
  columnContext, 
  onInfo, 
  onSuggest, 
  searchQuery, 
  playbackSpeed,
  language
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cellRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  
  const t = TRANSLATIONS[language];

  const getCategoryConfig = (cat: FunctionCategory) => {
    switch (cat) {
      case FunctionCategory.SecondaryDominant:
        return { label: t['cat.sec'], icon: ArrowRight, color: '#BE185D', bg: '#FCE7F3', fullLabel: t['cat.sec.full'] };
      case FunctionCategory.TritoneSub:
        return { label: t['cat.sub'], icon: ArrowRightLeft, color: '#4D7C0F', bg: '#ECFCCB', fullLabel: t['cat.sub.full'] };
      case FunctionCategory.ModalInterchange:
        return { label: t['cat.mod'], icon: Globe, color: '#0F766E', bg: '#CCFBF1', fullLabel: t['cat.mod.full'] };
      case FunctionCategory.DiminishedSub:
        return { label: t['cat.dim'], icon: CircleDot, color: '#B45309', bg: '#FEF3C7', fullLabel: t['cat.dim.full'] };
      default:
        return { label: '', icon: null, color: 'transparent', bg: 'transparent', fullLabel: '' };
    }
  };

  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isHovered && cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top - 8, // Position above the cell
        left: rect.left + rect.width / 2, // Center horizontally
      });
    } else {
      setTooltipPosition(null);
    }
  }, [isHovered]);

  const rootNote = transposeNote(currentKey, data.rootOffset);
  const bassNote = data.bassOffset !== undefined ? transposeNote(currentKey, data.bassOffset) : null;
  const chordName = `${rootNote}${data.quality}${bassNote ? `/${bassNote}` : ''}`;
  
  // Roman Numeral Logic
  const mainRoman = getRomanNumeral(data.rootOffset, data.quality);
  // For slash chords, simply display the bass numeral relative to key.
  const bassRoman = bassNote ? getRomanNumeral(data.bassOffset!, '') : '';
  const romanNumeral = mainRoman + (bassRoman ? `/${bassRoman}` : '');

  // Diagram Data
  const semitones = useMemo(() => getChordSemicones("", data.quality), [data.quality]);
  const absRoot = (currentKey + data.rootOffset) % 12;

  const isMatch = !searchQuery || 
                  chordName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (searchQuery.length > 1 && data.quality.toLowerCase().includes(searchQuery.toLowerCase()));

  // Modern UI Classes
  const baseClasses = "relative w-full h-12 flex items-center justify-between px-3 text-sm font-semibold transition-all duration-300 ease-out cursor-pointer select-none group rounded-xl border";
  
  let styleClasses = "";
  
  // Style Logic
  if (data.style === ChordStyle.Normal) {
    styleClasses = "bg-white border-slate-200 text-slate-700 shadow-sm hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/10";
  } else if (data.style === ChordStyle.Common) {
    styleClasses = "bg-slate-800 border-slate-800 text-white shadow-md hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-800/20";
  } else if (data.style === ChordStyle.Tension) {
    styleClasses = "bg-white border-slate-200 text-slate-700 shadow-sm ring-1 ring-slate-100 hover:border-orange-300 hover:ring-orange-100 hover:shadow-md";
  }

  // Active Playback State
  if (isPlaying) {
    styleClasses = "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-[1.02]";
  }

  const categoryConfig = getCategoryConfig(data.category);
  const hasCategory = data.category !== FunctionCategory.None;
  const CategoryIcon = categoryConfig.icon;

  const opacityStyle = isMatch ? "opacity-100" : "opacity-30 grayscale";

  const handleClick = () => {
    playChord(currentKey, data.rootOffset, data.quality, playbackSpeed);
    onSuggest(chordName);
    
    setIsPlaying(true);
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    
    const duration = 1200 * (1 / playbackSpeed); 
    playTimeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
    }, duration);
  };

  const handlePlayButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    playChord(currentKey, data.rootOffset, data.quality, playbackSpeed);
    
    setIsPlaying(true);
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    
    const duration = 1200 * (1 / playbackSpeed); 
    playTimeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
    }, duration);
  };

  const handleInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInfo(chordName, columnContext, data);
  };

  return (
    <>
      <div 
        ref={cellRef}
        className={`mb-2 ${baseClasses} ${styleClasses} ${opacityStyle}`}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ zIndex: isHovered ? 50 : 'auto' }}
      >
        {/* Left: Chord Name & Analysis */}
        <div className="flex items-center gap-2">
            {hasCategory && (
                <div 
                    className={`w-1.5 h-1.5 rounded-full ${isPlaying || data.style === ChordStyle.Common ? 'bg-white' : ''}`}
                    style={{ backgroundColor: isPlaying || data.style === ChordStyle.Common ? undefined : categoryConfig.color }}
                />
            )}
            <div className="flex flex-col leading-none">
                <span className="tracking-tight font-mono text-[13px] font-bold">{chordName}</span>
                {/* Roman Numeral Analysis */}
                <span className={`text-[9px] font-serif italic mt-0.5 ${isPlaying || data.style === ChordStyle.Common ? 'text-white/60' : 'text-slate-400'}`}>
                    {romanNumeral}
                </span>
            </div>
        </div>

        {/* Right: Functional Badge or Controls */}
        <div className="flex items-center justify-end relative min-w-[70px] h-full">
            {/* 1. Category Badge (Default View) */}
            {hasCategory && (
                <div 
                    className={`absolute right-0 flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-300 transform
                    ${isHovered ? 'opacity-0 translate-x-2 scale-95 pointer-events-none' : 'opacity-100 translate-x-0 scale-100'} 
                    ${data.style === ChordStyle.Common ? 'bg-white/20 text-white' : ''}`}
                    style={{ 
                      backgroundColor: data.style === ChordStyle.Common ? undefined : categoryConfig.bg,
                      color: data.style === ChordStyle.Common ? 'white' : categoryConfig.color 
                    }}
                >
                    {CategoryIcon && <CategoryIcon size={10} strokeWidth={3} />}
                    <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                      {categoryConfig.label}
                    </span>
                </div>
            )}

            {/* 2. Action Buttons (Hover View) */}
            <div className={`flex items-center justify-end gap-1 transition-all duration-300 transform absolute right-0
                ${isHovered ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-2 scale-90 pointer-events-none'}`}>
                
                <button 
                    onClick={handlePlayButton}
                    className={`
                        p-1.5 rounded-lg transition-colors
                        ${data.style === ChordStyle.Common || isPlaying ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'}
                    `}
                    title="Play"
                >
                    <Play size={14} fill="currentColor" strokeWidth={2} />
                </button>

                <button 
                    onClick={handleInfo}
                    className={`
                        p-1.5 rounded-lg transition-colors
                        ${data.style === ChordStyle.Common || isPlaying ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'}
                    `}
                    title="Analysis"
                >
                    <Info size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>

        {/* Playback Glow Overlay */}
        {isPlaying && (
            <div className="absolute inset-0 rounded-xl ring-2 ring-white/30 animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Tooltip - Rendered via Portal to avoid overflow clipping */}
      {isHovered && tooltipPosition && createPortal(
        <div 
          className="fixed p-3 bg-slate-900/95 text-white text-xs rounded-lg shadow-xl whitespace-nowrap cursor-default pointer-events-none backdrop-blur-sm border border-slate-700/50 flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-150 z-[10000]"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translate(-50%, -100%)',
            marginTop: '-8px',
          }}
        >
            <div className="flex flex-col items-center gap-0.5">
                <span className="font-bold tracking-wide text-sm">{chordName}</span>
                <span className="font-serif italic text-slate-400">{romanNumeral}</span>
            </div>

            {/* Mini Keyboard Diagram */}
            <div className="bg-slate-800/50 p-2 rounded-md border border-slate-700/50 mt-1">
                <div className="relative h-[36px] w-[205px] overflow-hidden">
                    <div className="origin-top-left transform scale-[0.35] absolute top-0 left-0">
                        <KeyboardDiagram rootNoteIndex={absRoot} intervals={semitones} />
                    </div>
                </div>
            </div>

            {hasCategory && (
               <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-medium tracking-wider uppercase pt-1 border-t border-slate-700 w-full justify-center">
                  {CategoryIcon && <CategoryIcon size={10} />}
                  <span>{categoryConfig.fullLabel}</span>
               </div>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900/95"></div>
        </div>,
        document.body
      )}
    </>
  );
};
