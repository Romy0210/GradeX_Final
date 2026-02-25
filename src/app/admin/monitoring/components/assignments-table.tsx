
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

const getAssignmentRisk = (completionPercentage: number): RiskLevel => {
    if (completionPercentage < 40) return 'High';
    if (completionPercentage < 70) return 'Medium';
    return 'Low';
};

const getRiskBadgeVariant = (risk: RiskLevel): 'destructive' | 'secondary' | 'default' => {
    if (risk === 'High') return 'destructive';
    if (risk === 'Medium') return 'secondary';
    return 'default';
};

export function AssignmentsTable({ data }: { data: MonitoredData[] }) {
    const [alertingStudent, setAlertingStudent] = useState<MonitoredData | null>(null);
    const { logActivity } = useActivityLog();
    const { toast } = useToast();

    const handleSendAlert = () => {
        if (!alertingStudent) return;
        logActivity('AI_ANALYSIS', `Sent high pending assignments alert to ${alertingStudent.studentName} for ${alertingStudent.subjectName}.`);
        toast({ title: 'Alert Sent', description: `Pending assignments notification sent to ${alertingStudent.studentName}.` });
        setAlertingStudent(null);
    };

    // Group the flattened data by studentId
    const groupedData = data.reduce((acc, item) => {
        if (!acc[item.studentId]) {
            acc[item.studentId] = [];
        }
        acc[item.studentId].push(item);
        return acc;
    }, {} as Record<string, MonitoredData[]>);

    return (
        <>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Completed</TableHead>
                            <TableHead className="text-center">Pending</TableHead>
                            <TableHead className="text-center">Completion %</TableHead>
                            <TableHead className="text-center">Risk Level</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.values(groupedData).length > 0 ? Object.values(groupedData).map(group => {
                            return group.map((item, index) => {
                                const pending = item.totalAssignments - item.completedAssignments;
                                const completionPercentage = item.totalAssignments > 0 ? (item.completedAssignments / item.totalAssignments) * 100 : 100;
                                const risk = getAssignmentRisk(completionPercentage);
                                const isFirstRow = index === 0;

                                return (
                                    <TableRow key={`${item.studentId}-${item.subjectId}`}>
                                        {isFirstRow && (
                                            <TableCell rowSpan={group.length} className="align-top border-r bg-muted/30">
                                                <div className="font-medium">{item.studentName}</div>
                                                <div className="text-xs text-muted-foreground mt-1">{item.studentId}</div>
                                            </TableCell>
                                        )}
                                        <TableCell>{item.subjectName}</TableCell>
                                        <TableCell className="text-center font-mono">{item.totalAssignments}</TableCell>
                                        <TableCell className="text-center font-mono">{item.completedAssignments}</TableCell>
                                        <TableCell className="text-center font-mono">{pending < 0 ? 0 : pending}</TableCell>
                                        <TableCell className="text-center font-mono">{completionPercentage.toFixed(1)}%</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getRiskBadgeVariant(risk)}>{risk}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => setAlertingStudent(item)}>
                                                <Bell className="h-4 w-4" />
                                                <span className="sr-only">Send Alert</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            });
                        }) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No assignment data matching the selected filters.
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
                            This will send a high pending assignments notification to <strong>{alertingStudent?.studentName}</strong> for the subject <strong>{alertingStudent?.subjectName}</strong>. Are you sure?
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
