"use client";

import { useMemo } from 'react';
import type { Student } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, ShieldAlert, GraduationCap, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
    if (student.riskLevel === 'High') {
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
                    <Accordion type="multiple" defaultValue={Object.keys(groupedData)}>
                        {Object.entries(groupedData).map(([groupKey, semesters]) => (
                            <AccordionItem value={groupKey} key={groupKey}>
                                <AccordionTrigger className="font-semibold text-md">{groupKey}</AccordionTrigger>
                                <AccordionContent className="pl-4 space-y-3">
                                    {Object.entries(semesters).map(([semester, data]) => {
                                        const total = data.students.length;
                                        const riskPercentage = total > 0 ? (data.highRisk / total) * 100 : 0;
                                        const avgGpa = total > 0 ? data.totalGpa / total : 0;
                                        return (
                                            <div key={semester} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-semibold">Semester {semester}</h4>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/admin/students?batch=${groupKey.split(' > ')[0]}&class=${groupKey.split(' > ')[1]}&semester=${semester}`}>
                                                            View Students <ChevronRight className="h-4 w-4 ml-1" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                                                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>{total} Students</span></div>
                                                    <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-muted-foreground" /><span>{data.highRisk} High Risk</span></div>
                                                    <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground" /><span>{avgGpa.toFixed(2)} Avg. GPA</span></div>
                                                </div>
                                                <div className="mt-2">
                                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                        <span>High Risk Exposure</span>
                                                        <span>{data.highRisk} of {total} ({riskPercentage.toFixed(0)}%)</span>
                                                    </div>
                                                    <Progress value={riskPercentage} className="h-2" />
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
