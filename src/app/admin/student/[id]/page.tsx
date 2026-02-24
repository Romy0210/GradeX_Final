'use client';
import { useParams } from 'next/navigation';
import { useStudentData } from '@/context/student-data-provider';
import { StudentPerformanceSnapshot } from './components/student-performance-snapshot';
import { AIPredictionPanel } from './components/ai-prediction-panel';
import { AIRecommendationsPanel } from './components/ai-recommendations-panel';
import { Loader2 } from 'lucide-react';

export default function StudentDetailPage() {
  const params = useParams();
  const { findStudentById, analyzingStudentId } = useStudentData();
  const studentId = typeof params.id === 'string' ? params.id : '';
  const student = findStudentById(studentId);

  if (!student) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <h1 className="text-2xl font-bold">Student not found.</h1>
        <p className="text-muted-foreground">
          The student with ID `{studentId}` could not be found. It might have been removed or the ID is incorrect.
        </p>
      </div>
    );
  }
  
  const isLoading = analyzingStudentId === student.id;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Student Analysis: {student.name}
          </h1>
          <p className="text-muted-foreground">
            A detailed snapshot and AI-powered insights for {student.name}.
          </p>
        </div>
        {isLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-1 flex flex-col gap-4 md:gap-8">
          <StudentPerformanceSnapshot student={student} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-8">
          <AIPredictionPanel
            predictionData={student}
            isLoading={isLoading}
          />
          <AIRecommendationsPanel 
            recommendationsData={student} 
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
}
