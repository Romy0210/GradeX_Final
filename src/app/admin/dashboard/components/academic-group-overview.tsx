"use client";

import { useMemo } from 'react';
import type { Student } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, ShieldAlert, GraduationCap, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type AcademicGroupOverviewProps = {
    students: Student[];
}

const groupStudents = (students: Student[]) => {
    return students.reduce((acc, student) => {
        const { batch, class: className, semester } = student;
        const groupKey = `${batch} > ${className}`;
        if (!acc[groupKey]) acc[groupKey] = {};
        if (!acc[groupKey][semester]) acc[groupKey][semester] = { students: [], highRisk: 0, totalGpa: 0 };

        acc[groupKey][semester].students.push(student);
        acc[groupKey][semester].totalGpa += student.gpa;
        const isHighRisk = student.riskLevel === 'High' || (student.subjectAnalyses?.some(sub => sub.riskLevel === 'High') ?? false);
        if (isHighRisk) {
            acc[groupKey][semester].highRisk++;
        }

        return acc;
    }, {} as Record<string, Record<string, { students: Student[], highRisk: number, totalGpa: number }>>);
};


export default function AcademicGroupOverview({ students }: AcademicGroupOverviewProps) {

    const groupedData = useMemo(() => groupStudents(students), [students]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Academic Group Intelligence</CardTitle>
                <CardDescription>Performance breakdown by batch, class, and semester.</CardDescription>
            </CardHeader>
            <CardContent>
                {Object.keys(groupedData).length === 0 ? (
                    <p className="text-muted-foreground text-center">No student data available to form groups.</p>
                ) : (
                    <Accordion type="multiple" defaultValue={[Object.keys(groupedData)[0]]} className="space-y-4">
                        {Object.entries(groupedData).map(([groupKey, semesters]) => (
                            <AccordionItem value={groupKey} key={groupKey} className="border rounded-xl overflow-hidden bg-muted/20 pb-0">
                                <AccordionTrigger className="font-bold text-lg px-4 hover:no-underline py-4 bg-muted/40">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                        {groupKey}
                                        <Badge variant="outline" className="ml-2 font-normal text-[10px]">{Object.keys(semesters).length} Semestres</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0 space-y-3">
                                    {Object.entries(semesters).map(([semester, data]) => {
                                        const total = data.students.length;
                                        const riskPercentage = total > 0 ? (data.highRisk / total) * 100 : 0;
                                        const avgGpa = total > 0 ? data.totalGpa / total : 0;
                                        return (
                                            <div key={semester} className="p-4 border rounded-xl hover:bg-muted/30 transition-all group/item">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                            <GraduationCap className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-base">Semester {semester}</h4>
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {total} Students</span>
                                                                <span className="flex items-center gap-1"><ShieldAlert className={`h-3 w-3 ${data.highRisk > 0 ? 'text-destructive' : ''}`} /> {data.highRisk} At Risk</span>
                                                                <span className="font-medium text-foreground/80">GPA: {avgGpa.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="hidden sm:block text-right mr-2">
                                                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Risk Exposure</p>
                                                            <p className={`text-sm font-bold ${riskPercentage > 30 ? 'text-destructive' : 'text-primary'}`}>{riskPercentage.toFixed(0)}%</p>
                                                        </div>
                                                        <Button variant="outline" size="sm" asChild className="rounded-full shadow-sm hover:shadow-md transition-all">
                                                            <Link href={`/admin/students?batch=${groupKey.split(' > ')[0]}&class=${groupKey.split(' > ')[1]}&semester=${semester}`}>
                                                                Manage <ChevronRight className="h-4 w-4 ml-1" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <Progress value={riskPercentage} className={`h-1.5 ${riskPercentage > 30 ? 'bg-destructive/10' : ''}`} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    )
}
