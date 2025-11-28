
export enum ChordStyle {
  Normal = 'NORMAL',
  Common = 'COMMON', // Red background
  Tension = 'TENSION', // Black background
  Special = 'SPECIAL'
}

export enum FunctionCategory {
  None = 'NONE',
  SecondaryDominant = 'SECONDARY_DOMINANT', // Pink border
  TritoneSub = 'TRITONE_SUB', // Green border
  ModalInterchange = 'MODAL_INTERCHANGE', // Blue border
  DiminishedSub = 'DIMINISHED_SUB', // Orange border
}

export type Language = 'en' | 'zh-HK' | 'zh-CN' | 'ja' | 'ko';

export interface ChordCellData {
  rootOffset: number; // Semitones from Key root. e.g., F in key of C is 5.
  quality: string; // e.g., "maj7", "7", "m7"
  bassOffset?: number; // For slash chords, e.g., D/F#
  displayOverride?: string; // If the logic is too complex, hardcode relative display
  style: ChordStyle;
  category: FunctionCategory;
}

export interface ColumnData {
  id: string;
  label: string;
  degree: string; // "IV", "V", "iii" etc.
  description: string;
  color: string;
  cells: (ChordCellData | null)[]; // Null represents an empty cell
}

export type KeyOption = {
  label: string;
  value: number; // 0 = C, 1 = C#, etc.
};

export interface ChordSuggestion {
  chordName: string;
  romanNumeral: string;
  explanation: string;
  confidence: string; // e.g., "High", "Medium"
}

export interface ChordSubstitution {
  chord: string;
  description: string;
  romanNumeral?: string;
}

export interface ChordVoicing {
  frets: number[]; // 6 strings, low E to high E. -1 = x, 0 = open
  baseFret: number;
  fingers?: number[];
}

export interface ChordAnalysis {
  usage: string;
  feeling: string;
}
