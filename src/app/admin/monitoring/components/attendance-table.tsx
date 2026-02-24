
'use client';
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useActivityLog } from '@/context/activity-log-provider';
import { useToast } from '@/hooks/use-toast';
import type { MonitoredData } from '../page';

type RiskLevel = 'Low' | 'Medium' | 'High';

const getAttendanceRisk = (percentage: number): RiskLevel => {
    if (percentage < 75) return 'High';
    if (percentage < 85) return 'Medium';
    return 'Low';
};

const getRiskBadgeVariant = (risk: RiskLevel): 'destructive' | 'secondary' | 'default' => {
    if (risk === 'High') return 'destructive';
    if (risk === 'Medium') return 'secondary';
    return 'default';
};

export function AttendanceTable({ data }: { data: MonitoredData[] }) {
    const [alertingStudent, setAlertingStudent] = useState<MonitoredData | null>(null);
    const { logActivity } = useActivityLog();
    const { toast } = useToast();

    const handleSendAlert = () => {
        if (!alertingStudent) return;
        logActivity('AI_ANALYSIS', `Sent low attendance alert to ${alertingStudent.studentName} for ${alertingStudent.subjectName}.`);
        toast({ title: 'Alert Sent', description: `Low attendance notification sent to ${alertingStudent.studentName}.` });
        setAlertingStudent(null);
    };

    const TOTAL_SESSIONS = 60; // Standardized total sessions per subject

    return (
        <>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">Attendance %</TableHead>
                            <TableHead className="text-center">Risk Level</TableHead>
                            <TableHead className="text-center">Total Sessions</TableHead>
                            <TableHead className="text-center">Present</TableHead>
                            <TableHead className="text-center">Absent</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length > 0 ? data.map(item => {
                            const risk = getAttendanceRisk(item.attendancePercentage);
                            const present = Math.round(TOTAL_SESSIONS * (item.attendancePercentage / 100));
                            const absent = TOTAL_SESSIONS - present;
                            return (
                                <TableRow key={`${item.studentId}-${item.subjectId}`}>
                                    <TableCell>
                                        <div className="font-medium">{item.studentName}</div>
                                        <div className="text-sm text-muted-foreground">{item.studentId}</div>
                                    </TableCell>
                                    <TableCell>{item.subjectName}</TableCell>
                                    <TableCell className="text-center font-mono">{item.attendancePercentage.toFixed(1)}%</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={getRiskBadgeVariant(risk)}>{risk}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-mono">{TOTAL_SESSIONS}</TableCell>
                                    <TableCell className="text-center font-mono">{present}</TableCell>
                                    <TableCell className="text-center font-mono">{absent}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setAlertingStudent(item)}>
                                            <Bell className="h-4 w-4" />
                                            <span className="sr-only">Send Alert</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        }) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No attendance data matching the selected filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <AlertDialog open={!!alertingStudent} onOpenChange={(open) => !open && setAlertingStudent(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Alert</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will send a low attendance notification to <strong>{alertingStudent?.studentName}</strong> for the subject <strong>{alertingStudent?.subjectName}</strong>. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSendAlert}>Send Alert</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
