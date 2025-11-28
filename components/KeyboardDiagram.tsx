import React from 'react';

interface Props {
  rootNoteIndex: number; // 0-11 (C to B)
  intervals: number[];   // e.g., [0, 4, 7] for Major
}

export const KeyboardDiagram: React.FC<Props> = ({ rootNoteIndex, intervals }) => {
  // Define keyboard range (2 octaves starting from C)
  // We will map indices 0-23. 0 is C, 1 is C#, etc.
  const numKeys = 24; // 2 Octaves (C3 to B4)
  
  // Calculate which notes (0-11) are active in the chord
  const activeNoteClasses = intervals.map(interval => (rootNoteIndex + interval) % 12);
  
  // Identify the specific keys to highlight.
  // We want to show the chord in a logical voicing. 
  // Simple approach: Highlight all keys that match the note classes.
  // Better approach for "Structure": Show Root + Intervals in specific octave if possible.
  // For this visualization, highlighting all instances is the clearest way to show "Notes in Chord".
  
  const getKeyType = (index: number) => {
    const note = index % 12;
    const isBlack = [1, 3, 6, 8, 10].includes(note);
    return isBlack ? 'black' : 'white';
  };

  const getNoteName = (index: number) => {
    const note = index % 12;
    // Standard mapping
    if (note === 0) return 'C';
    if (note === 1) return 'C#';
    if (note === 2) return 'D';
    if (note === 3) return 'Eb';
    if (note === 4) return 'E';
    if (note === 5) return 'F';
    if (note === 6) return 'F#';
    if (note === 7) return 'G';
    if (note === 8) return 'Ab';
    if (note === 9) return 'A';
    if (note === 10) return 'Bb';
    if (note === 11) return 'B';
    return '';
  };

  // Dimensions
  const whiteKeyWidth = 24;
  const whiteKeyHeight = 80;
  const blackKeyWidth = 14;
  const blackKeyHeight = 50;
  
  const whiteKeys = [];
  const blackKeys = [];

  let xPos = 0;

  for (let i = 0; i < numKeys; i++) {
    const noteClass = i % 12;
    const type = getKeyType(i);
    const isActive = activeNoteClasses.includes(noteClass);
    const isRoot = isActive && noteClass === rootNoteIndex;
    
    // Determine Fill Color
    let fill = type === 'white' ? '#FFFFFF' : '#333333'; // Default colors
    let stroke = '#E5E5E5';

    // Highlight logic
    const highlightColor = isRoot ? '#7F0019' : '#525252'; // Muji Red for Root, Dark Gray for others

    if (type === 'white') {
      whiteKeys.push({
        index: i,
        x: xPos,
        width: whiteKeyWidth,
        height: whiteKeyHeight,
        isActive,
        isRoot,
        highlightColor,
        noteClass
      });
      xPos += whiteKeyWidth;
    } else {
      // Black keys are drawn after to sit on top, but we calculate position now
      // Shift back half a black key width relative to the current boundary
      blackKeys.push({
        index: i,
        x: xPos - (blackKeyWidth / 2),
        width: blackKeyWidth,
        height: blackKeyHeight,
        isActive,
        isRoot,
        highlightColor,
        noteClass
      });
    }
  }

  const totalWidth = xPos;

  return (
    <div className="flex flex-col items-center">
      <svg width={totalWidth} height={whiteKeyHeight + 20} className="overflow-visible">
        {/* Draw White Keys */}
        {whiteKeys.map((key) => (
          <g key={`white-${key.index}`}>
            <rect
              x={key.x}
              y={0}
              width={key.width}
              height={key.height}
              fill="white"
              stroke="#E0E0E0"
              strokeWidth={1}
              rx={2}
              className="transition-colors duration-200"
            />
            {/* Highlight Indicator (Circle at bottom) */}
            {key.isActive && (
              <circle 
                cx={key.x + key.width / 2} 
                cy={key.height - 12} 
                r={4} 
                fill={key.highlightColor}
              />
            )}
             {/* Note Label (if Active) */}
             {key.isActive && (
              <text 
                x={key.x + key.width / 2} 
                y={key.height + 15} 
                textAnchor="middle" 
                className="text-[9px] font-mono fill-gray-500 font-bold"
              >
                {getNoteName(key.noteClass)}
              </text>
            )}
          </g>
        ))}

        {/* Draw Black Keys */}
        {blackKeys.map((key) => (
          <g key={`black-${key.index}`}>
            <rect
              x={key.x}
              y={0}
              width={key.width}
              height={key.height}
              fill="#333333"
              stroke="#333333"
              rx={1}
              className="transition-colors duration-200"
            />
             {/* Highlight Indicator (Circle at bottom of black key) */}
             {key.isActive && (
              <circle 
                cx={key.x + key.width / 2} 
                cy={key.height - 8} 
                r={3.5} 
                fill={key.highlightColor} // Usually red or white to contrast
                stroke="white"
                strokeWidth={1}
              />
            )}
          </g>
        ))}
        
        {/* Top decorative line */}
        <rect x={0} y={0} width={totalWidth} height={2} fill="#7F0019" opacity={0.8} />
      </svg>
    </div>
  );
};