import { NextResponse } from 'next/server';
import { generatePersonalizedRecommendations, type PersonalizedRecommendationsInput } from '@/ai/flows/generate-personalized-recommendations';

export async function POST(request: Request) {
  try {
    const body: PersonalizedRecommendationsInput = await request.json();
    const recommendations = await generatePersonalizedRecommendations(body);
    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: error.message },
      { status: 500 }
    );
  }
}
