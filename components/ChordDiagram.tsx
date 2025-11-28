import React from 'react';
import { ChordVoicing } from '../types';

interface Props {
  voicing: ChordVoicing;
}

export const ChordDiagram: React.FC<Props> = ({ voicing }) => {
  const { frets, baseFret } = voicing;
  const numStrings = 6;
  const numFrets = 5; // Display 5 frets
  
  // Dimensions - Increased for better readability
  const width = 160; 
  const height = 200;
  const paddingX = 24;
  const paddingY = 36; // Top padding for Nut/Text
  const stringSpacing = (width - 2 * paddingX) / (numStrings - 1);
  const fretSpacing = (height - paddingY - 12) / numFrets;

  return (
    <div className="flex flex-col items-center select-none">
      <svg width={width} height={height} className="overflow-visible">
        {/* Nut or Top Fret Line */}
        <line 
          x1={paddingX} y1={paddingY} 
          x2={width - paddingX} y2={paddingY} 
          stroke="currentColor" 
          strokeWidth={baseFret === 1 ? 4 : 1.5} 
          className="text-muji-text"
        />

        {/* Frets */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line 
            key={`fret-${i}`}
            x1={paddingX} y1={paddingY + i * fretSpacing}
            x2={width - paddingX} y2={paddingY + i * fretSpacing}
            stroke="currentColor" strokeWidth={1}
            className="text-gray-300"
          />
        ))}

        {/* Strings */}
        {Array.from({ length: numStrings }).map((_, i) => (
          <line 
            key={`string-${i}`}
            x1={paddingX + i * stringSpacing} y1={paddingY}
            x2={paddingX + i * stringSpacing} y2={paddingY + numFrets * fretSpacing}
            stroke="currentColor" strokeWidth={1}
            className="text-muji-text"
          />
        ))}

        {/* Dots & Markers */}
        {frets.map((fret, stringIndex) => {
          if (fret === -1) {
            // Muted 'X'
            return (
              <text 
                key={`mute-${stringIndex}`}
                x={paddingX + stringIndex * stringSpacing} 
                y={paddingY - 12} 
                textAnchor="middle" 
                className="text-[11px] fill-gray-400 font-sans font-bold"
              >X</text>
            );
          }
          
          if (fret === 0) {
            // Open 'O'
            return (
              <circle 
                key={`open-${stringIndex}`}
                cx={paddingX + stringIndex * stringSpacing} 
                cy={paddingY - 14} 
                r={3.5}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="text-gray-500"
              />
            );
          }
          
          // Fretted Note
          const relativeFret = fret - baseFret;
          if (relativeFret >= 0 && relativeFret < numFrets) {
            const finger = voicing.fingers ? voicing.fingers[stringIndex] : 0;
            return (
              <g key={`dot-group-${stringIndex}`}>
                <circle 
                  cx={paddingX + stringIndex * stringSpacing}
                  cy={paddingY + relativeFret * fretSpacing + (fretSpacing / 2)}
                  r={8.5}
                  className="fill-muji-text"
                />
                {finger > 0 && (
                   <text
                     x={paddingX + stringIndex * stringSpacing}
                     y={paddingY + relativeFret * fretSpacing + (fretSpacing / 2)}
                     dy=".35em"
                     textAnchor="middle"
                     className="fill-white text-[11px] font-bold font-mono"
                   >
                     {finger}
                   </text>
                )}
              </g>
            );
          }
          return null;
        })}
        
        {/* Base Fret Label */}
        {baseFret > 1 && (
            <text 
                x={paddingX - 14} 
                y={paddingY + (fretSpacing / 2) + 5} 
                textAnchor="end"
                className="text-[12px] font-bold fill-muji-text font-mono"
            >
                {baseFret}fr
            </text>
        )}
      </svg>
    </div>
  );
};