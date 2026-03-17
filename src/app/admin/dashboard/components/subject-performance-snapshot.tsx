"use client";

import { useMemo } from 'react';
import type { Student } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUpCircle, ArrowDownCircle, BarChart, GraduationCap } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

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

const MINIMUM_ENROLLMENT = 3; // Lowered to 3 to be more forgiving for smaller datasets

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
    <Card className="shadow-sm border-border bg-card">
        <CardHeader className="pb-3 bg-muted/30 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                {icon} {title}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
            {subjects.length > 0 ? subjects.map((sub, idx) => (
                <div key={sub.name} className="flex flex-col gap-1 border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs text-muted-foreground w-6 h-6 p-0 flex items-center justify-center font-bold">
                                {idx + 1}
                            </Badge>
                            <p className="font-semibold text-sm text-foreground">{sub.name}</p>
                        </div>
                        <p className={`font-bold text-sm ${primaryStat.key === 'failureRate' && sub[primaryStat.key] > 0 ? 'text-destructive' : 'text-foreground'}`}>
                            {primaryStat.format(sub[primaryStat.key])}
                        </p>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground pl-8">
                        <p>{sub.studentCount} student{sub.studentCount !== 1 ? 's' : ''}</p>
                        <p>{secondaryStat.label}: <span className="font-medium text-foreground">{secondaryStat.format(sub[secondaryStat.key])}</span></p>
                    </div>
                </div>
            )) : (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <BarChart className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No qualifying subjects</p>
                    <p className="text-xs text-slate-400">Not enough data to rank in this category.</p>
                </div>
            )}
        </CardContent>
    </Card>
);

export default function SubjectPerformanceSnapshot({ students }: { students: Student[] }) {
    // Group students by Batch > Class > Semester
    const groups = useMemo(() => {
        const map = new Map<string, Student[]>();
        students.forEach(s => {
            const key = `Batch ${s.batch} | ${s.class} | Sem ${s.semester}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(s);
        });

        // Convert to array and sort keys descending so newest batches/semesters might appear first
        return Array.from(map.entries())
            .map(([key, groupStudents]) => ({ key, students: groupStudents }))
            .sort((a, b) => b.key.localeCompare(a.key));
    }, [students]);

    return (
        <Card className="border-border shadow-sm overflow-hidden bg-card text-card-foreground">
            <CardHeader className="bg-card border-b border-border pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Structured Performance Snapshot</CardTitle>
                        <CardDescription className="mt-1">
                            Subject insights categorized by Batch, Class, and Semester based on the latest AI analysis.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {groups.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No students available for analysis.</div>
                ) : (
                    <Accordion type="single" collapsible defaultValue={groups[0]?.key} className="w-full">
                        {groups.map((group) => {
                            const subjectStats = calculateSubjectStats(group.students);
                            
                            const sortedByRisk = [...subjectStats].sort((a, b) => b.riskScore - a.riskScore);
                            const sortedByPerformance = [...subjectStats].sort((a, b) => b.performanceScore - a.performanceScore);

                            const topAtRisk = sortedByRisk.slice(0, 3);
                            const topAtRiskIds = new Set(topAtRisk.map(s => s.name));
                            
                            const topPerformers = sortedByPerformance.filter(s => !topAtRiskIds.has(s.name)).slice(0, 3);
                            
                            const hasSufficientData = subjectStats.length > 0;

                            return (
                                <AccordionItem key={group.key} value={group.key} className="border-b-0 border-t border-border first:border-t-0">
                                    <AccordionTrigger className="px-6 py-4 hover:bg-accent/50 transition-colors data-[state=open]:bg-accent/30">
                                        <div className="flex items-center gap-3 text-left">
                                            <span className="font-semibold text-foreground">{group.key}</span>
                                            <Badge variant="secondary" className="hover:bg-secondary">
                                                {group.students.length} Student{group.students.length !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 pt-4 bg-muted/10 border-t border-border">
                                        {!hasSufficientData ? (
                                            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl bg-background">
                                                <BarChart className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                                <h3 className="font-semibold text-foreground text-lg">Insufficient Subject Data</h3>
                                                <p className="text-muted-foreground text-sm max-w-sm mt-1">
                                                    Subject-level insights require a minimum of {MINIMUM_ENROLLMENT} enrolled students with completed performance analysis in this specific group.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <SubjectStatDisplayCard
                                                    title="Top Performing Subjects"
                                                    icon={<ArrowUpCircle className="text-green-600 h-5 w-5" />}
                                                    subjects={topPerformers}
                                                    primaryStat={{ key: 'avgGpa', label: 'Avg GPA', format: (val) => val.toFixed(2) }}
                                                    secondaryStat={{ key: 'failureRate', label: 'Failure Rate', format: (val) => `${val.toFixed(0)}%` }}
                                                />
                                                <SubjectStatDisplayCard
                                                    title="Most At-Risk Subjects"
                                                    icon={<ArrowDownCircle className="text-red-500 h-5 w-5" />}
                                                    subjects={topAtRisk}
                                                    primaryStat={{ key: 'failureRate', label: 'Failure Rate', format: (val) => `${val.toFixed(0)}%` }}
                                                    secondaryStat={{ key: 'avgGpa', label: 'Avg GPA', format: (val) => val.toFixed(2) }}
                                                />
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    )
}
