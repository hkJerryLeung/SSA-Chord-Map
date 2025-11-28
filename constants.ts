import { ChordStyle, FunctionCategory, ColumnData, KeyOption } from './types';

export const KEYS: KeyOption[] = [
  { label: 'C', value: 0 },
  { label: 'C# / Db', value: 1 },
  { label: 'D', value: 2 },
  { label: 'D# / Eb', value: 3 },
  { label: 'E', value: 4 },
  { label: 'F', value: 5 },
  { label: 'F# / Gb', value: 6 },
  { label: 'G', value: 7 },
  { label: 'G# / Ab', value: 8 },
  { label: 'A', value: 9 },
  { label: 'A# / Bb', value: 10 },
  { label: 'B', value: 11 },
];

// Helper to create cells quickly
const c = (
  rootOffset: number, 
  quality: string, 
  style: ChordStyle = ChordStyle.Normal, 
  category: FunctionCategory = FunctionCategory.None,
  bassOffset?: number
) => ({ rootOffset, quality, style, category, bassOffset });

// Column definitions with Muji-style background classes (neutral grays and beige)

// Column 1: IV (Subdominant) - Clean White
const col4: ColumnData = {
  id: 'iv', label: 'IV', degree: 'Subdominant', description: 'Development', color: 'bg-white', 
  cells: [
    c(5, '', ChordStyle.Normal), // F
    c(5, 'maj7', ChordStyle.Common), // Fmaj7
    c(5, 'maj9', ChordStyle.Common), // Fmaj9
    c(5, 'maj13', ChordStyle.Tension), // Fmaj13
    c(5, 'maj7(#11)', ChordStyle.Tension), 
    c(5, 'maj9(#11)', ChordStyle.Tension),
    c(5, 'maj13(#11)', ChordStyle.Normal),
    c(5, '6/9', ChordStyle.Normal),
    c(7, '', ChordStyle.Normal, FunctionCategory.None, 5), // G/F (G triad over F)
    c(5, 'add2/9', ChordStyle.Normal),
    c(5, 'sus2', ChordStyle.Normal),
    c(5, '6', ChordStyle.Normal),
    null,
    c(6, 'dim', ChordStyle.Common, FunctionCategory.DiminishedSub), // F#dim (secondary to G)
    c(6, 'm7(b5)', ChordStyle.Common, FunctionCategory.SecondaryDominant),
    c(2, '', ChordStyle.Common, FunctionCategory.SecondaryDominant, 6), // D/F#
    c(2, '7', ChordStyle.Common, FunctionCategory.SecondaryDominant, 6), // D7/F#
  ]
};

// Column 2: V (Dominant) - Clean White
const col5: ColumnData = {
  id: 'v', label: 'V', degree: 'Dominant', description: 'Tension', color: 'bg-white',
  cells: [
    c(7, '', ChordStyle.Normal), // G
    c(7, '7', ChordStyle.Common), // G7
    c(7, '9', ChordStyle.Common),
    c(7, '11', ChordStyle.Common), // Note: Often G11 implies F/G
    c(7, '13', ChordStyle.Tension),
    c(7, '13sus', ChordStyle.Tension),
    c(5, '', ChordStyle.Common, FunctionCategory.None, 7), // F/G
    c(5, 'maj7', ChordStyle.Tension, FunctionCategory.None, 7), // Fmaj7/G
    c(7, 'add2/9', ChordStyle.Normal),
    c(7, 'sus2', ChordStyle.Normal),
    c(7, 'sus4', ChordStyle.Common),
    c(7, '7sus4', ChordStyle.Common),
    c(7, '(#5)', ChordStyle.Normal),
    c(7, '(b9)', ChordStyle.Common, FunctionCategory.SecondaryDominant), // G7b9
    c(7, 'sus4(b9)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(5, 'm', ChordStyle.Tension, FunctionCategory.ModalInterchange, 7), // Fm/G
    c(7, '11(b9)', ChordStyle.Tension),
    c(7, '13(b9)', ChordStyle.Tension),
    c(7, '13sus(b9)', ChordStyle.Tension),
    c(7, '7(b9b13)', ChordStyle.Tension),
    c(7, '9(#11)', ChordStyle.Tension),
    c(7, '13(#11)', ChordStyle.Normal),
    c(7, '13(b9#11)', ChordStyle.Normal),
    c(7, '7(#5#9)', ChordStyle.Normal),
    c(7, '7(#5b9)', ChordStyle.Normal),
    c(7, '9(b13)', ChordStyle.Normal),
  ]
};

// Column 3: iii (Mediant) - Clean White
const col3: ColumnData = {
  id: 'iii', label: 'iii', degree: 'Mediant', description: 'Bridge/Ext', color: 'bg-white',
  cells: [
    c(4, 'm', ChordStyle.Normal), // Em
    c(4, 'm7', ChordStyle.Common),
    c(4, 'm9', ChordStyle.Tension),
    c(4, 'm11', ChordStyle.Tension),
    c(4, 'm7(add11)', ChordStyle.Tension),
    c(4, 'm7(b5)', ChordStyle.Common, FunctionCategory.SecondaryDominant), // Em7b5 (related to A7)
    c(0, '', ChordStyle.Common, FunctionCategory.None, 4), // C/E
    c(0, 'add2', ChordStyle.Common, FunctionCategory.None, 4), // Cadd2/E
    c(4, '', ChordStyle.Common, FunctionCategory.SecondaryDominant), // E major
    c(4, '7', ChordStyle.Common, FunctionCategory.SecondaryDominant), // E7
    c(4, '7sus4', ChordStyle.Common, FunctionCategory.SecondaryDominant),
    c(4, '7(#5)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(4, '7(#9)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(4, '7(b9)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(4, '7(#5#9)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(4, '7(#5b9)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
  ]
};

// Column 4: Passing 1 - Subtle Kraft Paper Tone
const colPass1: ColumnData = {
  id: 'pass1', label: 'Pass', degree: 'V/V', description: 'Approach V', color: 'bg-[#F2F0EB]',
  cells: [
    c(2, '', ChordStyle.Normal, FunctionCategory.None, 6), // D/F#
    c(2, '7', ChordStyle.Normal, FunctionCategory.None, 6), // D7/F#
    c(6, 'dim', ChordStyle.Normal, FunctionCategory.DiminishedSub), // F#dim
    c(6, 'dim7', ChordStyle.Normal, FunctionCategory.DiminishedSub), // F#dim7
    c(6, 'm7(b5)', ChordStyle.Normal, FunctionCategory.SecondaryDominant), // F#m7b5
  ]
};

// Column 5: Passing 2 - Subtle Kraft Paper Tone
const colPass2: ColumnData = {
  id: 'pass2', label: 'Pass', degree: 'V/vi', description: 'Approach vi', color: 'bg-[#F2F0EB]',
  cells: [
    c(4, '', ChordStyle.Common, FunctionCategory.SecondaryDominant, 8), // E/G#
    c(4, '7', ChordStyle.Common, FunctionCategory.SecondaryDominant, 8), // E7/G#
    c(8, 'dim', ChordStyle.Normal, FunctionCategory.DiminishedSub), // G#dim
    c(8, 'dim7', ChordStyle.Normal, FunctionCategory.DiminishedSub), // G#dim7
  ]
};

// Column 6: vi (Submediant) - Clean White
const col6: ColumnData = {
  id: 'vi', label: 'vi', degree: 'Submediant', description: 'Resolution', color: 'bg-white',
  cells: [
    c(9, 'm', ChordStyle.Normal), // Am
    c(9, 'm7', ChordStyle.Common), // Am7
    c(9, 'm9', ChordStyle.Tension), // Am9
    c(9, 'm11', ChordStyle.Tension), // Am11
    c(9, 'm7(add11)', ChordStyle.Normal),
    c(7, '', ChordStyle.Common, FunctionCategory.None, 9), // G/A
    c(9, '7', ChordStyle.Common, FunctionCategory.SecondaryDominant), // A7 (Sec dom to D or ii)
    c(9, '9', ChordStyle.Normal, FunctionCategory.SecondaryDominant),
    c(9, '11', ChordStyle.Normal, FunctionCategory.SecondaryDominant),
    c(9, '13', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(9, '7(b9)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(9, '11(b9)', ChordStyle.Normal, FunctionCategory.SecondaryDominant),
    c(9, '13(b9)', ChordStyle.Normal, FunctionCategory.SecondaryDominant),
    c(9, '7(b9b13)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(9, '7(#5)', ChordStyle.Common, FunctionCategory.SecondaryDominant),
    c(9, '7(#9)', ChordStyle.Normal, FunctionCategory.SecondaryDominant),
    c(9, '7(#5#9)', ChordStyle.Normal, FunctionCategory.SecondaryDominant),
    c(9, '7(#5b9)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(9, '9(#11)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(9, '7(b9#11)', ChordStyle.Tension, FunctionCategory.SecondaryDominant),
    c(3, '6', ChordStyle.Common, FunctionCategory.TritoneSub), // Eb6 
    c(3, '7', ChordStyle.Normal, FunctionCategory.TritoneSub), // Eb7
    c(3, '9', ChordStyle.Tension, FunctionCategory.TritoneSub), // Eb9
    c(3, '11', ChordStyle.Normal, FunctionCategory.TritoneSub), // Eb11
    c(3, '13', ChordStyle.Tension, FunctionCategory.TritoneSub), // Eb13
  ]
};

export const CHORD_DATA = [col4, col5, col3, colPass1, colPass2, col6];