import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface QuestionData {
  question: string;
  tag: string;
  frequency: number;
  years: string[];
}

export interface SubjectAnalysis {
  subject: string;
  data: QuestionData[];
}

export interface AnalysisResult {
  subject_analysis: SubjectAnalysis[];
}

export interface RepeatedQuestion {
  question_hindi: string;
  question_english: string;
  frequency: number;
  years: string[];
  subject: string;
}

export interface PredictionQuestion {
  question_hindi: string;
  question_english: string;
  reasoning: string;
  unit: string;
  marks: number;
  category: 'Must-Learn' | 'Gap' | 'Challenge';
}

export interface PredictionResult {
  repeated_questions: RepeatedQuestion[];
  must_learn: PredictionQuestion[];
  gap_questions: PredictionQuestion[];
  challenge_questions: PredictionQuestion[];
}

export async function predictQuestions(pyqBase64: string, syllabusBase64: string, focusSubject?: string): Promise<PredictionResult> {
  const model = "gemini-3.1-pro-preview"; 
  
  const prompt = `
    Role: You are an Academic Predictor and Subject Matter Expert for RGPV Diploma Computer Science.
    ${focusSubject ? `FOCUS SUBJECT: ${focusSubject}. Prioritize analysis and predictions for this specific subject.` : ""}

    Inputs:
    - File A (PYQ): Multiple years of previous question papers.
    - File B (Syllabus): The current official 2026 syllabus.

    Task:
    1. Extract ALL repeated questions from File A (PYQs). Identify how many times each appeared and in which years.
    2. Group these repeated questions by Subject or Topic (e.g., Computer Networks, DBMS, etc.).
    3. Based on File A and File B (Syllabus Sync), predict questions likely to appear in the upcoming exam.

    Output Requirement:
    Return a JSON object with:
    - repeated_questions: A comprehensive list of EVERY question found to be repeated in the PYQs. For each question, provide both a Hindi translation (question_hindi) and the original English text (question_english).
    - must_learn, gap_questions, challenge_questions: Your expert predictions for the upcoming exam. For each, provide both a Hindi translation (question_hindi) and the English text (question_english).
    - Ensure the total number of predicted questions (must_learn + gap_questions + challenge_questions) is at least 15-20, with a minimum of 10 "new" or "gap/challenge" questions.

    Predictions logic:
    - "Must-Learn": High-frequency repeats that are still in the 2026 syllabus.
    - "Gap": Syllabus topics that haven't appeared in the last 3 years but are core concepts.
    - "Challenge": High-mark complex topics (7-10 marks) from the syllabus.

    Format for each prediction:
    - question_hindi: The question translated into clear Hindi.
    - question_english: The question in technical English.
    - Reasoning: Why are you predicting this?
    - Unit Number: Which unit it belongs to.
    - Expected Marks: (2, 5, or 7 marks).

    Return a strictly valid JSON object. Do not include any text outside the JSON block.

    JSON Schema:
    {
      "repeated_questions": [
        { "question_hindi": "...", "question_english": "...", "frequency": 3, "years": ["2022", "2023", "2024"], "subject": "..." }
      ],
      "must_learn": [
        { "question_hindi": "...", "question_english": "...", "reasoning": "...", "unit": "...", "marks": 7, "category": "Must-Learn" }
      ],
      "gap_questions": [
        { "question_hindi": "...", "question_english": "...", "reasoning": "...", "unit": "...", "marks": 5, "category": "Gap" }
      ],
      "challenge_questions": [
        { "question_hindi": "...", "question_english": "...", "reasoning": "...", "unit": "...", "marks": 7, "category": "Challenge" }
      ]
    }
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pyqBase64,
            },
          },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: syllabusBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to predict questions. Please try again.");
  }
}
