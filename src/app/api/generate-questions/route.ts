import { NextRequest, NextResponse } from 'next/server';
import { generateQuizQuestions, QuizGenerationRequest } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body: QuizGenerationRequest = await request.json();
    
    if (!body.topic || !body.questionCount || !body.questionTypes?.length) {
      return NextResponse.json(
        { error: 'Topic, question count, and question types are required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const questions = await generateQuizQuestions(body);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    );
  }
} 