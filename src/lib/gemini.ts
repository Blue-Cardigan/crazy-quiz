import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client
const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export interface GeneratedQuestion {
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  answers: {
    text: string;
    isCorrect: boolean;
  }[];
}

export interface QuizGenerationRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  questionTypes: ('multiple_choice' | 'true_false' | 'short_answer')[];
}

export async function generateQuizQuestions(request: QuizGenerationRequest): Promise<GeneratedQuestion[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const prompt = `Generate ${request.questionCount} quiz questions about "${request.topic}" at ${request.difficulty} difficulty level.

Instructions:
- Use these question types: ${request.questionTypes.join(', ')}
- For multiple choice questions: provide 4 options with exactly 1 correct answer
- For true/false questions: provide the statement and correct answer
- For short answer questions: provide the question and expected answer
- Make questions educational and engaging
- Ensure answers are factually accurate

Return the response as a JSON array where each question object has:
- text: string (the question)
- type: 'multiple_choice' | 'true_false' | 'short_answer'
- answers: array of objects with {text: string, isCorrect: boolean}

For short answer questions, the answers array should contain one object with the expected answer text and isCorrect: true.

Example format:
[
  {
    "text": "What is the capital of France?",
    "type": "multiple_choice",
    "answers": [
      {"text": "London", "isCorrect": false},
      {"text": "Paris", "isCorrect": true},
      {"text": "Berlin", "isCorrect": false},
      {"text": "Madrid", "isCorrect": false}
    ]
  }
]`;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    if (!response.text) {
      throw new Error('No response text received from Gemini');
    }
    
    // Parse JSON response
    const cleanedResponse = response.text.replace(/```json\n?|\n?```/g, '').trim();
    const questions = JSON.parse(cleanedResponse);
    
    return questions as GeneratedQuestion[];
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate quiz questions. Please try again.');
  }
}

export async function generateSingleQuestion(topic: string, type: 'multiple_choice' | 'true_false' | 'short_answer'): Promise<GeneratedQuestion> {
  const questions = await generateQuizQuestions({
    topic,
    difficulty: 'medium',
    questionCount: 1,
    questionTypes: [type]
  });
  
  return questions[0];
} 