import { NextResponse } from 'next/server';
import { generateStudentReport, type GenerateStudentReportInput } from '@/ai/flows/generate-student-report';

export async function POST(request: Request) {
  try {
    // The body now contains the full student object plus model parameters
    const body: GenerateStudentReportInput = await request.json();
    const report = await generateStudentReport(body);
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error generating student report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error.message },
      { status: 500 }
    );
  }
}
