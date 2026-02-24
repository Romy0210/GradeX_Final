"use client";

import { useMemo } from 'react';
import type { Student } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, BarChart } from 'lucide-react';

// New type for richer stats
type SubjectStats = {
  name: string;
  studentCount: number;
  avgGpa: number;
  failureRate: number;
  highRiskRate: number;
  performanceScore: number;
  riskScore: number;
};

const MINIMUM_ENROLLMENT = 5;

const calculateSubjectStats = (students: Student[]): SubjectStats[] => {
    const subjectMap = new Map<string, { 
        totalGpa: number; 
        failCount: number; 
        studentCount: number; 
        highRiskCount: number; 
    }>();

    const gradePoints: Record<string, number> = { 'S': 10, 'A+': 9, 'A': 8.5, 'B+': 8, 'B': 7.5, 'C+': 7, 'C': 6.5, 'D': 6, 'F': 0 };
    const studentGpaForSubject = (grade: string) => gradePoints[grade] || 0;

    // 1. Aggregate Raw Stats from student subject analyses
    students.forEach(student => {
        if (!student.subjectAnalyses) return;
        student.subjectAnalyses.forEach(subAnalysis => {
            if (!subjectMap.has(subAnalysis.subjectName)) {
                subjectMap.set(subAnalysis.subjectName, { 
                    totalGpa: 0, 
                    failCount: 0, 
                    studentCount: 0,
                    highRiskCount: 0 
                });
            }
            const stat = subjectMap.get(subAnalysis.subjectName)!;
            
            stat.studentCount++;
            stat.totalGpa += studentGpaForSubject(subAnalysis.gradeCategory);
            if (subAnalysis.outcome === 'Fail') {
                stat.failCount++;
            }
            if (subAnalysis.riskLevel === 'High') {
                stat.highRiskCount++;
            }
        });
    });

    // 2. Calculate Derived Stats, Scores, and Filter
    const calculatedStats: SubjectStats[] = [];
    subjectMap.forEach((stats, name) => {
        // Rule 1: Minimum Enrollment Validation
        if (stats.studentCount < MINIMUM_ENROLLMENT) {
            return;
        }

        const avgGpa = stats.studentCount > 0 ? stats.totalGpa / stats.studentCount : 0;
        const failureRate = stats.studentCount > 0 ? (stats.failCount / stats.studentCount) * 100 : 0;
        const highRiskRate = stats.studentCount > 0 ? (stats.highRiskCount / stats.studentCount) * 100 : 0;

        // Rule 2 & 3: Ranking Logic
        const performanceScore = (avgGpa * 0.5) + ((100 - failureRate) * 0.3) + ((100 - highRiskRate) * 0.2);
        const riskScore = (failureRate * 0.5) + (highRiskRate * 0.3) + ((10 - avgGpa) * 0.2);

        calculatedStats.push({
            name,
            studentCount: stats.studentCount,
            avgGpa,
            failureRate,
            highRiskRate,
            performanceScore,
            riskScore,
        });
    });
    
    return calculatedStats;
};

const SubjectStatDisplayCard = ({ title, icon, subjects, primaryStat, secondaryStat }: {
    title: string;
    icon: React.ReactNode;
    subjects: SubjectStats[];
    primaryStat: { key: 'avgGpa' | 'failureRate', label: string, format: (val: number) => string };
    secondaryStat: { key: 'avgGpa' | 'failureRate', label: string, format: (val: number) => string };
}) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">{icon} {title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            {subjects.length > 0 ? subjects.map(sub => (
                <div key={sub.name} className="text-sm">
                    <div className="flex justify-between">
                        <p className="font-semibold">{sub.name}</p>
                        <p className="font-bold">{primaryStat.format(sub[primaryStat.key])}</p>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <p>{sub.studentCount} students</p>
                        <p>{secondaryStat.label}: {secondaryStat.format(sub[secondaryStat.key])}</p>
                    </div>
                </div>
            )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No subjects meet the criteria for this category.</p>
            )}
        </CardContent>
    </Card>
);


export default function SubjectPerformanceSnapshot({ students }: { students: Student[] }) {
    const subjectStats = useMemo(() => calculateSubjectStats(students), [students]);

    // Rule 4: Duplicate Category Prevention
    // A subject appearing in the "at-risk" list should not also appear in "top-performing".
    const sortedByRisk = [...subjectStats].sort((a, b) => b.riskScore - a.riskScore);
    const sortedByPerformance = [...subjectStats].sort((a, b) => b.performanceScore - a.performanceScore);

    const topAtRisk = sortedByRisk.slice(0, 3);
    const topAtRiskIds = new Set(topAtRisk.map(s => s.name));
    
    const topPerformers = sortedByPerformance.filter(s => !topAtRiskIds.has(s.name)).slice(0, 3);
    
    const hasSufficientData = subjectStats.length > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Subject Performance Snapshot</CardTitle>
                <CardDescription>A weighted analysis of subject performance, showing top performers and those most at-risk.</CardDescription>
            </CardHeader>
            <CardContent>
                {!hasSufficientData ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                        <BarChart className="h-10 w-10 text-muted-foreground mb-3" />
                        <h3 className="font-semibold text-lg">Insufficient Data</h3>
                        <p className="text-muted-foreground text-sm max-w-sm">
                           Subject-level insights require a minimum of {MINIMUM_ENROLLMENT} enrolled students with completed performance analysis per subject.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SubjectStatDisplayCard
                            title="Top Performing Subjects"
                            icon={<ArrowUpCircle className="text-green-500" />}
                            subjects={topPerformers}
                            primaryStat={{ key: 'avgGpa', label: 'Avg GPA', format: (val) => val.toFixed(2) }}
                            secondaryStat={{ key: 'failureRate', label: 'Failure Rate', format: (val) => `${val.toFixed(0)}%` }}
                        />
                        <SubjectStatDisplayCard
                            title="Most At-Risk Subjects"
                            icon={<ArrowDownCircle className="text-red-500" />}
                            subjects={topAtRisk}
                            primaryStat={{ key: 'failureRate', label: 'Failure Rate', format: (val) => `${val.toFixed(0)}%` }}
                            secondaryStat={{ key: 'avgGpa', label: 'Avg GPA', format: (val) => val.toFixed(2) }}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
