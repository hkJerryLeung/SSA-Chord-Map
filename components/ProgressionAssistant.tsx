
import React, { useState, useEffect, useRef } from 'react';
import { ColumnData, ChordSuggestion, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { getNextChordSuggestions } from '../services/geminiService';
import { transposeNote, playChordFromName } from '../utils/music';
import { Sparkles, ArrowRight, PlayCircle, Loader2, X, Plus, Trash2, Play, Music, Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentKey: number;
  keyLabel: string;
  columns: ColumnData[];
  initialChord?: string;
  playbackSpeed: number;
  playlist: string[];
  onAddToPlaylist: (chord: string) => void;
  onRemoveFromPlaylist: (index: number) => void;
  language: Language;
}

export const ProgressionAssistant: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  currentKey, 
  keyLabel, 
  columns, 
  initialChord,
  playbackSpeed,
  playlist,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  language
}) => {
  const [selectedChord, setSelectedChord] = useState<string>("");
  const [suggestions, setSuggestions] = useState<ChordSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedFor, setGeneratedFor] = useState("");
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [sequenceDelay, setSequenceDelay] = useState(1.0);
  
  const playingRef = useRef(false);
  const t = TRANSLATIONS[language];

  const availableChords = React.useMemo(() => {
    const list: string[] = [];
    columns.forEach(col => {
      col.cells.forEach(cell => {
        if (cell) {
          const root = transposeNote(currentKey, cell.rootOffset);
          const bass = cell.bassOffset !== undefined ? transposeNote(currentKey, cell.bassOffset) : null;
          const name = `${root}${cell.quality}${bass ? `/${bass}` : ''}`;
          if (!list.includes(name)) list.push(name);
        }
      });
    });
    return list;
  }, [columns, currentKey]);

  useEffect(() => {
    if (initialChord && availableChords.includes(initialChord)) {
      setSelectedChord(initialChord);
    } else if (availableChords.length > 0 && !selectedChord) {
       if (!initialChord) {
           setSelectedChord(availableChords[0]);
       }
    }
  }, [initialChord, availableChords, selectedChord]);

  useEffect(() => {
    if (initialChord) {
        setSelectedChord(initialChord);
    }
  }, [initialChord]);

  // Stop playing if modal closes
  useEffect(() => {
      if (!isOpen) {
          playingRef.current = false;
          setIsPlayingSequence(false);
      }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!selectedChord) return;
    setIsLoading(true);
    setSuggestions([]);
    
    const results = await getNextChordSuggestions(selectedChord, keyLabel, language);
    setSuggestions(results);
    setGeneratedFor(selectedChord);
    setIsLoading(false);
  };

  const playSequence = async () => {
    if (playlist.length === 0 || isPlayingSequence) return;
    
    setIsPlayingSequence(true);
    playingRef.current = true;

    // Global speed affects the tempo of the sequence.
    const interval = (sequenceDelay * 1000) * (1/playbackSpeed);

    for (let i = 0; i < playlist.length; i++) {
        if (!playingRef.current) break;
        
        const chord = playlist[i];
        playChordFromName(chord, playbackSpeed);
        
        // Wait for next chord
        await new Promise(r => setTimeout(r, interval));
    }
    
    setIsPlayingSequence(false);
    playingRef.current = false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#F7F7F2]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white border border-muji-border shadow-[0_4px_20px_rgba(0,0,0,0.05)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-muji-border flex justify-between items-center bg-stone-50 flex-none">
          <div className="flex items-center gap-3">
            <span className="text-muji-red"><Sparkles size={18} /></span>
            <h3 className="font-serif font-bold text-muji-text tracking-wide uppercase">{t['assist.title']}</h3>
          </div>
          <button onClick={onClose} className="text-muji-accent-gray hover:text-muji-red transition-colors">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="mb-8">
            <label className="block text-xs font-bold text-muji-accent-gray uppercase tracking-widest mb-3">
              {t['assist.current']} ({keyLabel} Major)
            </label>
            <div className="flex gap-0">
              <select 
                value={selectedChord}
                onChange={(e) => setSelectedChord(e.target.value)}
                className="flex-1 bg-muji-bg border border-muji-border border-r-0 text-muji-text text-base rounded-l-[2px] focus:outline-none focus:bg-white block p-3 font-mono"
              >
                {availableChords.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-muji-text text-white px-6 py-3 rounded-r-[2px] hover:bg-muji-red disabled:bg-muji-border disabled:text-muji-accent-gray disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                <span className="text-xs uppercase tracking-wider font-bold">{t['assist.suggest']}</span>
              </button>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                  <div className="h-[1px] flex-1 bg-muji-border"></div>
                  <span className="text-[10px] font-bold text-muji-accent-gray uppercase tracking-widest">
                    {t['assist.next']}
                  </span>
                  <div className="h-[1px] flex-1 bg-muji-border"></div>
              </div>
              
              {suggestions.length > 0 ? (
                suggestions.map((s, idx) => (
                    <div key={idx} className="border border-muji-border p-5 hover:border-muji-red transition-colors bg-white group relative">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-serif font-bold text-muji-text">{s.chordName}</span>
                            <span className="text-xs font-mono text-muji-accent-gray border border-muji-border px-1.5 py-0.5">{s.romanNumeral}</span>
                        </div>
                        <span className={`text-[9px] uppercase tracking-[0.2em] font-bold mt-2 inline-block text-muji-accent-gray`}>
                            {s.confidence}
                        </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => onAddToPlaylist(s.chordName)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E0E0E0] hover:bg-muji-red hover:border-muji-red hover:text-white text-muji-text text-[10px] font-bold uppercase tracking-widest rounded-[2px] transition-all shadow-sm"
                                title="Add to Playlist"
                            >
                                <Plus size={12} strokeWidth={2} />
                                <span>{t['assist.add']}</span>
                            </button>
                            <button 
                                onClick={() => playChordFromName(s.chordName, playbackSpeed)}
                                className="text-muji-border hover:text-muji-red transition-colors p-1"
                                title="Preview"
                            >
                                <PlayCircle size={28} strokeWidth={1} />
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-muji-text font-light leading-relaxed border-t border-muji-bg pt-3 mt-1">
                        {s.explanation}
                    </p>
                    </div>
                ))
              ) : null}
            </div>
          )}
          
          {suggestions.length === 0 && !isLoading && (
            <div className="text-center py-12 border border-dashed border-muji-border text-muji-accent-gray bg-stone-50">
              <p className="text-xs uppercase tracking-widest">{t['assist.empty']}</p>
            </div>
          )}
        </div>

        {/* Playlist / Favorites Section */}
        <div className="p-4 bg-stone-50 border-t border-muji-border flex-none">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Music size={14} className="text-muji-text" />
                    <span className="text-[10px] font-bold text-muji-text uppercase tracking-widest">{t['playlist.title']}</span>
                </div>
                
                {playlist.length > 0 && (
                  <div className="flex items-center gap-4">
                      {/* Interval/Gap Control */}
                      <div className="flex items-center gap-2 mr-2 group">
                         <Clock size={12} className="text-gray-400 group-hover:text-muji-text transition-colors" />
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hidden sm:inline group-hover:text-muji-text transition-colors">{t['playlist.gap']}</span>
                         
                         <div className="flex items-center gap-2">
                           <input 
                              type="range"
                              min="0.2"
                              max="4.0"
                              step="0.2"
                              value={sequenceDelay}
                              onChange={(e) => setSequenceDelay(Number(e.target.value))}
                              disabled={isPlayingSequence}
                              className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#333333] hover:accent-muji-red transition-all"
                           />
                           <span className="text-[10px] font-mono text-muji-text min-w-[2.5rem] text-right border-b border-transparent">{sequenceDelay.toFixed(1)}s</span>
                         </div>
                      </div>

                      <button 
                          onClick={playSequence}
                          disabled={isPlayingSequence}
                          className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-[1px] border transition-all ${isPlayingSequence ? 'border-muji-red text-muji-red bg-white' : 'border-gray-300 text-gray-500 hover:border-muji-text hover:text-muji-text bg-white'}`}
                      >
                          {isPlayingSequence ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                          {isPlayingSequence ? t['playlist.playing'] : t['playlist.play']}
                      </button>
                  </div>
                )}
            </div>
            
            {playlist.length === 0 ? (
                <div className="text-center py-4 text-xs text-gray-400 italic font-mono">
                    {t['playlist.empty']}
                </div>
            ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {playlist.map((chord, idx) => (
                        <div key={`${chord}-${idx}`} className="flex-shrink-0 group relative bg-white border border-gray-200 px-3 py-2 min-w-[4rem] text-center rounded-[1px] hover:border-muji-text transition-colors cursor-pointer shadow-sm" onClick={() => playChordFromName(chord, playbackSpeed)}>
                            <span className="font-mono text-sm font-medium text-muji-text block">{chord}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRemoveFromPlaylist(idx); }}
                                className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 text-gray-400 hover:text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                    
                    {/* Visual spacer to prevent last item being cut off */}
                    <div className="w-2 flex-shrink-0"></div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
