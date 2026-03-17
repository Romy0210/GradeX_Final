import { NextResponse } from 'next/server';
import { generateStudentReport } from '@/ai/flows/generate-student-report';
import type { Student } from '@/lib/data';

type StudentAnalysisInput = Omit<Student, 'riskLevel' | 'outcome' | 'gradeCategory' | 'predictionConfidence' | 'failureRiskProbability' | 'academicRecommendations' | 'behavioralRecommendations' | 'interventionRecommendations'>;

// Helper function to introduce a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const { students: studentsToAnalyze, modelParameters }: { students: StudentAnalysisInput[], modelParameters?: { highRiskThreshold: number; mediumRiskThreshold: number; } } = await request.json();

    if (!studentsToAnalyze || !Array.isArray(studentsToAnalyze)) {
      return NextResponse.json({ error: 'Invalid input: students array is required.' }, { status: 400 });
    }

    const processedStudents = [];
    for (const student of studentsToAnalyze) {
      const report = await generateStudentReport({
        gpa: student.gpa,
        attendancePercentage: student.attendancePercentage,
        assignmentCompletionPercentage: student.assignmentCompletionPercentage,
        pendingAssignments: student.pendingAssignments,
        overallAverageMarkPercentage: student.overallAverageMarkPercentage,
        subjects: student.subjects?.map(s => ({
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          internalMark1: s.internalMark1 ?? 0,
          internalMark2: s.internalMark2 ?? 0,
          totalAssignments: s.totalAssignments ?? 0,
          completedAssignments: s.completedAssignments ?? 0,
          subjectAttendancePercentage: s.subjectAttendancePercentage,
        })),
        highRiskThreshold: modelParameters?.highRiskThreshold,
        mediumRiskThreshold: modelParameters?.mediumRiskThreshold,
      });
      processedStudents.push({
        ...student,
        ...report,
      });
      // Add a delay to respect API rate limits (e.g., 20 requests per minute for the free tier)
      // 60 seconds / 20 requests = 3 seconds per request.
      await delay(3000);
    }

    return NextResponse.json({ students: processedStudents });
  } catch (error: any) {
    console.error('Error during bulk analysis:', error);
    return NextResponse.json(
      { error: 'Failed to run bulk analysis', details: error.message },
      { status: 500 }
    );
  }
}
