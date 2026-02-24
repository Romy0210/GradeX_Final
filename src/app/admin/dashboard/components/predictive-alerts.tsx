"use client";

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useStudentData } from '@/context/student-data-provider';
import type { Student } from '@/lib/data';

type Alert = {
    icon: React.ReactNode;
    title: string;
    description: string;
    link: string;
    severity: "High" | "Medium" | "Low";
};

// Helper function to group students by their academic group
const groupStudents = (students: Student[]) => {
  return students.reduce((acc, student) => {
    const groupKey = `${student.batch}|${student.class}|${student.semester}`;
    if (!acc[groupKey]) {
      acc[groupKey] = {
        batch: student.batch,
        class: student.class,
        semester: student.semester,
        students: [],
      };
    }
    acc[groupKey].students.push(student);
    return acc;
  }, {} as Record<string, { batch: string; class: string; semester: string; students: Student[] }>);
};

export default function PredictiveAlerts() {
    const { students } = useStudentData();

    const alerts = useMemo(() => {
        const dynamicAlerts: Alert[] = [];
        if (students.length === 0) return [];

        const groupedByAcademicGroup = groupStudents(students);

        // --- Alert 1: Students Likely to Fail ---
        let maxFailingGroup = { count: 0, groupName: '', link: '' };
        for (const key in groupedByAcademicGroup) {
            const group = groupedByAcademicGroup[key];
            const failingCount = group.students.filter(s => s.outcome === 'Fail').length;
            if (failingCount > maxFailingGroup.count && failingCount >= 1) {
                maxFailingGroup = {
                    count: failingCount,
                    groupName: `${group.class} - Sem ${group.semester}`,
                    link: `/admin/students?risk=High&batch=${encodeURIComponent(group.batch)}&class=${encodeURIComponent(group.class)}&semester=${encodeURIComponent(group.semester)}`,
                };
            }
        }
        if (maxFailingGroup.count > 0) {
            dynamicAlerts.push({
                icon: <AlertTriangle className="h-5 w-5 text-destructive" />,
                title: `${maxFailingGroup.count} Student(s) Likely to Fail`,
                description: `In ${maxFailingGroup.groupName}, ${maxFailingGroup.count} student(s) are predicted to fail.`,
                link: maxFailingGroup.link,
                severity: "High",
            });
        }

        // --- Alert 2: High Absenteeism Trend ---
        let lowestAttendanceGroup = { avg: 101, groupName: '', link: '' };
        for (const key in groupedByAcademicGroup) {
            const group = groupedByAcademicGroup[key];
            if (group.students.length === 0) continue;
            const totalAttendance = group.students.reduce((sum, s) => sum + s.attendancePercentage, 0);
            const avgAttendance = totalAttendance / group.students.length;
            if (avgAttendance < lowestAttendanceGroup.avg && avgAttendance < 85) { // Threshold
                lowestAttendanceGroup = {
                    avg: avgAttendance,
                    groupName: `${group.class} - Sem ${group.semester}`,
                    link: `/admin/analytics?batch=${encodeURIComponent(group.batch)}&class=${encodeURIComponent(group.class)}&semester=${encodeURIComponent(group.semester)}`,
                };
            }
        }
        if (lowestAttendanceGroup.avg <= 85) {
             dynamicAlerts.push({
                icon: <TrendingDown className="h-5 w-5 text-yellow-500" />,
                title: "High Absenteeism Detected",
                description: `Avg attendance has dropped to ${lowestAttendanceGroup.avg.toFixed(0)}% in ${lowestAttendanceGroup.groupName}.`,
                link: lowestAttendanceGroup.link,
                severity: "Medium",
            });
        }
        
        // --- Alert 3: Assignment Deadline Risk (Corrected Logic) ---
        const subjectsWithPendingAssignments: { name: string; affected: number; total: number; groupName: string, link: string }[] = [];
        const uniqueSubjects: { name: string; batch: string; class: string; semester: string }[] = [];
        
        students.forEach(student => {
            student.subjects.forEach(subject => {
                const subjectIdentifier = `${student.batch}|${student.class}|${student.semester}|${subject.subjectName}`;
                if (!uniqueSubjects.some(s => `${s.batch}|${s.class}|${s.semester}|${s.name}` === subjectIdentifier)) {
                    uniqueSubjects.push({ name: subject.subjectName, batch: student.batch, class: student.class, semester: student.semester });
                }
            });
        });

        uniqueSubjects.forEach(subjectInfo => {
            const enrolledStudents = students.filter(s => 
                s.batch === subjectInfo.batch &&
                s.class === subjectInfo.class &&
                s.semester === subjectInfo.semester &&
                s.subjects.some(sub => sub.subjectName === subjectInfo.name)
            );
            
            if (enrolledStudents.length > 0) {
                 const affectedStudentsCount = enrolledStudents.filter(s => s.pendingAssignments > 3).length;

                 if (affectedStudentsCount > 1) { 
                     subjectsWithPendingAssignments.push({
                         name: subjectInfo.name,
                         affected: affectedStudentsCount,
                         total: enrolledStudents.length,
                         groupName: `${subjectInfo.class} - Sem ${subjectInfo.semester}`,
                         link: `/admin/students?batch=${encodeURIComponent(subjectInfo.batch)}&class=${encodeURIComponent(subjectInfo.class)}&semester=${encodeURIComponent(subjectInfo.semester)}&subject=${encodeURIComponent(subjectInfo.name)}`
                     });
                 }
            }
        });

        if(subjectsWithPendingAssignments.length > 0) {
            const topSubjectRisk = subjectsWithPendingAssignments.sort((a,b) => b.affected - a.affected)[0];
            const percentage = ((topSubjectRisk.affected / topSubjectRisk.total) * 100).toFixed(0);
            dynamicAlerts.push({
                icon: <Clock className="h-5 w-5 text-blue-500" />,
                title: "Assignment Deadline Risk",
                description: `${topSubjectRisk.affected} of ${topSubjectRisk.total} (${percentage}%) in "${topSubjectRisk.name}" have >3 pending assignments.`,
                link: topSubjectRisk.link,
                severity: "Low",
            });
        }


        // Sort alerts by severity and return top 3
        const severityOrder = { High: 1, Medium: 2, Low: 3 };
        return dynamicAlerts
            .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
            .slice(0, 3);

    }, [students]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Prediction Alerts</CardTitle>
                <CardDescription>System-generated alerts based on performance trends.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {alerts.length > 0 ? alerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 rounded-lg border">
                        <div>{alert.icon}</div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.description}</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={alert.link}>View</Link>
                        </Button>
                    </div>
                )) : (
                     <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground text-center py-4">No critical alerts at this time. System is stable.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
