import { Chord, Note, Interval } from 'tonal';

// Helper to determine if a note string implies a sharp key context
const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const transposeNote = (rootIndex: number, offset: number): string => {
  const notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const sharpKeys = [7, 2, 9, 4, 11, 6, 1]; 
  const useSharps = sharpKeys.includes(rootIndex);
  
  const normalizedIndex = ((rootIndex + offset) % 12 + 12) % 12;
  return useSharps ? sharps[normalizedIndex] : notes[normalizedIndex];
};

export const getChordData = (chordName: string) => {
  const chord = Chord.get(chordName);
  return chord;
};

export const getChordSemicones = (rootName: string, quality: string): number[] => {
    const fullName = (rootName || 'C') + quality;
    const chord = Chord.get(fullName);
    
    if (chord.empty) {
        return [0, 4, 7]; 
    }
    return chord.intervals.map(Interval.semitones);
};

export const getIntervalNames = (semitones: number[]): string[] => {
  const map: Record<number, string> = {
    0: 'R', 1: 'b9', 2: '9', 3: 'm3', 4: '3', 5: '11', 
    6: '#11', 7: '5', 8: 'b13', 9: '13', 10: 'b7', 11: 'maj7',
    12: 'R', 13: 'b9', 14: '9', 15: '#9', 17: '11', 18: '#11', 21: '13'
  };
  return semitones.map(s => map[s] || `${s}`);
};

export const getRomanNumeral = (rootOffset: number, quality: string): string => {
    const numerals = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'];
    let base = numerals[rootOffset % 12];
    
    // Determine if we should lowercase the numeral (minor/diminished root function)
    const isMinor = quality.startsWith('m') && !quality.startsWith('maj');
    const isDim = quality.startsWith('dim');
    
    if (isMinor || isDim) {
        base = base.toLowerCase();
    }
    
    return `${base}${quality}`;
};

export const getABCNotation = (chordName: string): string => {
    const chord = Chord.get(chordName);
    if (chord.empty) return "";

    const rootNote = chord.tonic || 'C';
    // Logic to handle voicing for display
    // If it's a slash chord, Tonal might give us the bass.
    // We want to generate a clean closed voicing or a simple open one.
    
    let notes: string[] = [];
    
    if (chord.notes && chord.notes.length > 0) {
        // Tonal returns notes sorted by pitch class usually, but if we want a specific voicing:
        // Let's build a simple voicing around Middle C (C4)
        
        // Find bass note
        const bass = chordName.includes('/') ? chordName.split('/')[1] : rootNote;
        
        // Start constructing from bass
        const bassMidi = Note.midi(`${bass}3`) || 48; // Bass in octave 3
        notes.push(`${bass}3`);
        
        // Add rest of notes above bass
        chord.notes.forEach(n => {
            if (n === bass) return; // Skip if it's the bass we already added
            
            // Find note above bass
            let candidateOctave = 3;
            let candidateMidi = Note.midi(`${n}${candidateOctave}`);
            while (candidateMidi && candidateMidi <= bassMidi) {
                candidateOctave++;
                candidateMidi = Note.midi(`${n}${candidateOctave}`);
            }
            // Keep it within reasonable range (not too high)
            if (candidateOctave > 5) candidateOctave = 4;
            
            notes.push(`${n}${candidateOctave}`);
        });
    } else {
         // Fallback
         const startOctave = 4;
         notes = Chord.getChord(chord.type, `${rootNote}${startOctave}`).notes;
    }

    const abcNotes = notes.map(n => {
        const midi = Note.midi(n);
        if (!midi) return "C";
        
        const step = n.slice(0, -1);
        const octave = parseInt(n.slice(-1));
        
        let abcChar = step.replace('b', '_').replace('#', '^');
        
        if (octave === 4) {
            return abcChar;
        } else if (octave === 5) {
            return abcChar.toLowerCase();
        } else if (octave === 3) {
            return `${abcChar},`;
        } else if (octave >= 6) {
            return `${abcChar.toLowerCase()}'`;
        } else if (octave === 2) {
            return `${abcChar},,`;
        }
        
        return abcChar;
    }).join(" ");

    return `[${abcNotes}]`;
};

/**
 * ADVANCED AUDIO ENGINE
 * Simulates an Electric Piano (Rhodes-ish) using Subtractive Synthesis.
 */

const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

const playTone = (freq: number, startTime: number, duration: number, volume: number) => {
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator(); // Detuned oscillator for richness
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // 1. Oscillators: Mix of Triangle (body) and Sine (sub)
    osc.type = 'triangle';
    osc2.type = 'sine';
    
    // Slight detune for chorus effect
    osc.frequency.value = freq;
    osc2.frequency.value = freq;
    osc2.detune.value = 4; // cents

    // 2. Filter: Low Pass to warm up the sound (remove harsh digital highs)
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;

    // 3. Envelope (ADSR)
    // Attack: Fast but not instant (pop removal)
    // Decay: Quick drop to sustain level
    // Sustain: Held note volume
    // Release: Long tail
    const attackTime = 0.02;
    const decayTime = 0.3;
    const sustainLevel = 0.4;
    const releaseTime = 1.5;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attackTime);
    gain.gain.exponentialRampToValueAtTime(volume * sustainLevel, startTime + attackTime + decayTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration + releaseTime);

    // Connections
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    // Filter Envelope (opens up on attack, closes down on decay - "wah" effect)
    filter.frequency.setValueAtTime(800, startTime);
    filter.frequency.linearRampToValueAtTime(3000, startTime + attackTime);
    filter.frequency.exponentialRampToValueAtTime(1000, startTime + attackTime + decayTime);

    osc.start(startTime);
    osc2.start(startTime);
    osc.stop(startTime + duration + releaseTime);
    osc2.stop(startTime + duration + releaseTime);
};

export const playChord = (rootIndex: number, offset: number, quality: string, speed: number = 1) => {
  // Legacy wrapper if needed, but we prefer playChordFromName for inversions
  const notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const rootName = notes[(rootIndex + offset) % 12];
  playChordFromName(`${rootName}${quality}`, speed);
};

export const playChordFromName = (chordName: string, speed: number = 1) => {
    if (ctx.state === 'suspended') ctx.resume();

    // 1. Get the real notes from Tonal (Handles Inversions/Slash Chords automatically)
    // e.g. "C/E" -> ["E", "G", "C"]
    const chord = Chord.get(chordName);
    if (chord.empty) return;
    
    const notes = chord.notes;
    const now = ctx.currentTime;
    
    // 2. Assign Octaves Logic (Voicing)
    // Start Bass Note around C3 (MIDI 48)
    // Ensure subsequent notes always go UP in pitch
    let currentMidi = 0;
    const frequencies: number[] = [];

    notes.forEach((noteName, index) => {
        let midi = Note.midi(`${noteName}3`); // Try octave 3 first
        
        if (!midi) return;

        // If it's the bass note (index 0), ensure it's in a nice bass range (45-57)
        if (index === 0) {
            // Adjust octave if too low or high
            while (midi < 45) midi += 12;
            while (midi > 57) midi -= 12;
            currentMidi = midi;
        } else {
            // For subsequent notes, ensure they are higher than the previous note
            // Find the closest octave that is > currentMidi
            let potentialMidi = Note.midi(`${noteName}3`) || 0;
            while (potentialMidi <= currentMidi) {
                potentialMidi += 12;
            }
            currentMidi = potentialMidi;
            midi = potentialMidi;
        }

        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        frequencies.push(freq);
    });

    // 3. Play Tones with Strum Effect
    const strumSpeed = 0.04 / speed; // Time between strings
    
    frequencies.forEach((freq, i) => {
        // Bass note louder, higher notes slightly softer
        const volume = i === 0 ? 0.25 : 0.15; 
        playTone(freq, now + (i * strumSpeed), 1.0, volume);
    });
};