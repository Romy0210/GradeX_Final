"use client";

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrendingUp, Link2, CheckSquare } from 'lucide-react';
import type { Student } from '@/lib/data';

type CorrelationSummaryProps = {
    students: Student[];
};

// Helper function to calculate the Pearson Correlation Coefficient
const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    if (n === 0) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0; // No variance, so no correlation

    return numerator / denominator;
};

// Helper function to interpret the correlation coefficient
const interpretCorrelation = (r: number): { text: string; color: string; } => {
    const absR = Math.abs(r);
    const direction = r > 0 ? 'Positive' : 'Negative';

    if (absR >= 0.8) return { text: `Very Strong ${direction}`, color: 'text-green-500' };
    if (absR >= 0.6) return { text: `Strong ${direction}`, color: 'text-green-500' };
    if (absR >= 0.4) return { text: `Moderate ${direction}`, color: 'text-yellow-500' };
    if (absR >= 0.2) return { text: `Weak ${direction}`, color: 'text-yellow-500' };
    
    return { text: 'Very Weak / No Correlation', color: 'text-muted-foreground' };
};

const CorrelationInsight = ({ title, icon, data }: { title: string, icon: React.ReactNode, data: { r: number, interpretation: { text: string, color: string }, sampleSize: number } | null }) => {
    if (!data) {
        return (
            <div className="p-3 border rounded-lg">
                <h4 className="font-semibold text-sm flex items-center gap-2">{icon} {title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                    Insufficient data for reliable correlation analysis. (Requires at least 5 students)
                </p>
            </div>
        );
    }

    return (
        <div className="p-3 border rounded-lg">
            <h4 className="font-semibold text-sm flex items-center gap-2">{icon} {title}</h4>
            <div className="flex justify-between items-center mt-2">
                <div className='text-left'>
                    <p className="text-2xl font-bold">{data.r.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Pearson (r)</p>
                </div>
                <div className="text-right">
                    <p className={`font-bold text-lg ${data.interpretation.color}`}>{data.interpretation.text}</p>
                    <p className="text-xs text-muted-foreground">Based on {data.sampleSize} students</p>
                </div>
            </div>
        </div>
    );
};


export default function CorrelationSummary({ students }: CorrelationSummaryProps) {
    const MIN_SAMPLE_SIZE = 5;

    const attendanceVsGpa = useMemo(() => {
        const validData = students.filter(s => s.attendancePercentage != null && s.gpa != null);
        if (validData.length < MIN_SAMPLE_SIZE) return null;
        
        const attendance = validData.map(s => s.attendancePercentage);
        const gpa = validData.map(s => s.gpa);
        const r = calculatePearsonCorrelation(attendance, gpa);

        return {
            r,
            interpretation: interpretCorrelation(r),
            sampleSize: validData.length
        };
    }, [students]);

    const assignmentsVsGpa = useMemo(() => {
        const validData = students.filter(s => s.assignmentCompletionPercentage != null && s.gpa != null);
        if (validData.length < MIN_SAMPLE_SIZE) return null;
        
        const assignments = validData.map(s => s.assignmentCompletionPercentage);
        const gpa = validData.map(s => s.gpa);
        const r = calculatePearsonCorrelation(assignments, gpa);

        return {
            r,
            interpretation: interpretCorrelation(r),
            sampleSize: validData.length
        };
    }, [students]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Link2 /> Correlation Intelligence</CardTitle>
                <CardDescription>Dynamically calculated relationships between key performance indicators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <CorrelationInsight 
                    title="Attendance vs. GPA"
                    icon={<TrendingUp className="h-4 w-4" />}
                    data={attendanceVsGpa}
                />
                <CorrelationInsight 
                    title="Assignments vs. GPA"
                    icon={<CheckSquare className="h-4 w-4" />}
                    data={assignmentsVsGpa}
                />
            </CardContent>
        </Card>
    );
}
