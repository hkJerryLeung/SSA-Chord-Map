
import { GoogleGenAI, Type } from "@google/genai";
import { ChordSuggestion, ChordSubstitution, ChordVoicing, Language, ChordAnalysis } from "../types";
import { LANGUAGE_LABELS } from "../translations";

let ai: GoogleGenAI | null = null;

const initAI = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing");
    return null;
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const explainChordFunction = async (
  chordName: string,
  keyName: string,
  context: string,
  language: Language
): Promise<ChordAnalysis | null> => {
  const client = initAI();
  if (!client) return null;

  const targetLang = LANGUAGE_LABELS[language];

  try {
    const prompt = `
      You are an expert jazz music theory instructor. 
      Analyze the function of the chord **${chordName}** in the key of **${keyName}**.
      The chord is found in the **"${context}"** column of a chord substitution chart.
      
      Provide a structured analysis in **${targetLang}**.
    `;

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              usage: { type: Type.STRING, description: `Concise explanation of harmonic function (e.g., secondary dominant, resolution) in ${targetLang}` },
              feeling: { type: Type.STRING, description: `Brief description of the chord's emotional character or color (e.g., tension, bright, melancholic) in ${targetLang}` }
            },
            required: ["usage", "feeling"]
          }
        }
    });

    if (response.text) {
        return JSON.parse(response.text) as ChordAnalysis;
    }
    return null;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

export const getNextChordSuggestions = async (
  currentChord: string,
  keyName: string,
  language: Language
): Promise<ChordSuggestion[]> => {
  const client = initAI();
  if (!client) return [];
  
  const targetLang = LANGUAGE_LABELS[language];

  try {
    const prompt = `
      I am composing music in the key of ${keyName}.
      The current chord is ${currentChord}.
      Based on Jazz and Pop harmony theory, suggest 3 distinct options for the NEXT chord.
      
      Include:
      1. A standard/safe option.
      2. A tension/jazz option (e.g., secondary dominant, tritone sub).
      3. A creative/unexpected option (e.g., modal interchange, chromatic mediant).

      IMPORTANT: Translate the 'explanation' and 'confidence' fields into **${targetLang}**.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              chordName: { type: Type.STRING, description: "The specific chord symbol, e.g., G7(b9)" },
              romanNumeral: { type: Type.STRING, description: "The roman numeral analysis, e.g., V7/ii" },
              explanation: { type: Type.STRING, description: `Why this chord works well here (in ${targetLang}).` },
              confidence: { type: Type.STRING, description: `Style tag: Standard, Jazz, or Creative (in ${targetLang})` }
            },
            required: ["chordName", "romanNumeral", "explanation", "confidence"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ChordSuggestion[];
    }
    return [];

  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};

export const getChordSubstitutions = async (
  chordName: string,
  keyName: string,
  context: string,
  language: Language
): Promise<ChordSubstitution[]> => {
  const client = initAI();
  if (!client) return [];

  const targetLang = LANGUAGE_LABELS[language];

  try {
    const prompt = `
      Suggest 4 common chord substitutions for **${chordName}** in the key of **${keyName}**.
      The context is: ${context}.
      
      Provide the substitution chord symbol, its roman numeral analysis relative to the key, and a very brief (2-5 words) theoretical reason (e.g. "Tritone Sub", "Relative Minor").
      
      IMPORTANT: Write the 'description' field in **${targetLang}**.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              chord: { type: Type.STRING, description: "The substituted chord symbol" },
              romanNumeral: { type: Type.STRING, description: "The roman numeral analysis, e.g., bII7" },
              description: { type: Type.STRING, description: `Brief theoretical reason in ${targetLang}` }
            },
            required: ["chord", "romanNumeral", "description"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ChordSubstitution[];
    }
    return [];

  } catch (error) {
    console.error("Gemini Substitution Error:", error);
    return [];
  }
};

export const getChordVoicing = async (chordName: string): Promise<ChordVoicing | null> => {
  const client = initAI();
  if (!client) return null;

  try {
    const prompt = `
      Generate a standard guitar jazz chord voicing for **${chordName}**.
      Prefer drop 2 or drop 3 voicings or common jazz shapes if applicable to the chord quality.
      The output must be a valid JSON object.
    `;
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            frets: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "Array of 6 integers representing fret numbers for strings Low E to High E. Use -1 for muted strings (x), 0 for open strings."
            },
            baseFret: {
              type: Type.INTEGER,
              description: "The fret number of the first visible fret in the diagram (usually 1, or higher for barre chords up the neck)."
            },
            fingers: {
               type: Type.ARRAY,
               items: { type: Type.INTEGER },
               description: "Optional array of 6 integers. 0 for no finger, 1=Index, 2=Middle, 3=Ring, 4=Pinky."
            }
          },
          required: ["frets", "baseFret"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ChordVoicing;
    }
    return null;
  } catch (error) {
    console.error("Gemini Voicing Error:", error);
    return null;
  }
};
