import { NextResponse } from 'next/server';
import { generateStudyPlan, type GenerateStudyPlanInput } from '@/ai/flows/generate-study-plan';

export async function POST(request: Request) {
  try {
    const body: GenerateStudyPlanInput = await request.json();
    const studyPlan = await generateStudyPlan(body);
    return NextResponse.json(studyPlan);
  } catch (error: any) {
    console.error('Error generating study plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate study plan', details: error.message },
      { status: 500 }
    );
  }
}
