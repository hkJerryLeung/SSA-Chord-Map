import React, { useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import { getABCNotation } from '../utils/music';

interface Props {
  chordName: string;
}

export const StaffNotation: React.FC<Props> = ({ chordName }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && chordName) {
      const abcNotes = getABCNotation(chordName);
      // Construct a simple ABC tune
      // L:1/1 = whole notes
      // K:C = Key of C (rendering accidentals relative to C)
      const abcString = `
X:1
T: 
M: 4/4
L: 1/1
K: C
${abcNotes} |]
      `;
      
      abcjs.renderAbc(containerRef.current, abcString, {
        scale: 1.1,
        staffwidth: 200,
        paddingtop: 0,
        paddingbottom: 0,
        paddingright: 0,
        paddingleft: 0,
        responsive: "resize",
        add_classes: true
      });
    }
  }, [chordName]);

  return (
    <div className="w-full flex justify-center opacity-80" ref={containerRef}></div>
  );
};