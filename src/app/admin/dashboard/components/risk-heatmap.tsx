"use client";

import { useMemo } from 'react';
import type { Student } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type RiskHeatmapProps = {
    students: Student[];
}

const groupAndAnalyze = (students: Student[]) => {
  const groups = students.reduce((acc, student) => {
    const key = `${student.batch}|${student.class}|${student.semester}`;
    if (!acc[key]) {
      acc[key] = { batch: student.batch, class: student.class, semester: student.semester, high: 0, medium: 0, low: 0, total: 0 };
    }
    acc[key][student.riskLevel.toLowerCase() as 'high' | 'medium' | 'low']++;
    acc[key].total++;
    return acc;
  }, {} as Record<string, { batch: string; class: string; semester: string; high: number; medium: number; low: number; total: number; }>);

  return Object.values(groups);
};

const getRiskColor = (highRiskPercent: number): string => {
    if (highRiskPercent > 50) return 'bg-red-500/30 text-red-900 dark:text-red-200';
    if (highRiskPercent > 25) return 'bg-yellow-500/30 text-yellow-900 dark:text-yellow-200';
    if (highRiskPercent > 10) return 'bg-blue-500/20 text-blue-900 dark:text-blue-200';
    return 'bg-green-500/20 text-green-900 dark:text-green-200';
};

const TooltipCell = ({ children, content, className }: { children: React.ReactNode; content: React.ReactNode; className?: string }) => (
    <TableCell className={className}>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="w-full h-full">{children}</div>
            </TooltipTrigger>
            <TooltipContent>
                {content}
            </TooltipContent>
        </Tooltip>
    </TableCell>
);


export default function RiskHeatmap({ students }: RiskHeatmapProps) {

    const heatmapData = useMemo(() => groupAndAnalyze(students), [students]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Risk Intelligence Heatmap</CardTitle>
                <CardDescription>At-a-glance risk overview for academic groups, colored by high-risk percentage.</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Batch</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Sem</TableHead>
                                <TableHead className="text-center">High</TableHead>
                                <TableHead className="text-center">Medium</TableHead>
                                <TableHead className="text-center">Low</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {heatmapData.length > 0 ? heatmapData.map(group => {
                                const highRiskPercent = group.total > 0 ? (group.high / group.total) * 100 : 0;
                                const mediumRiskPercent = group.total > 0 ? (group.medium / group.total) * 100 : 0;
                                const lowRiskPercent = group.total > 0 ? (group.low / group.total) * 100 : 0;
                                
                                const colorClass = getRiskColor(highRiskPercent);
                                
                                const tooltipContent = (
                                    <div className="p-1 space-y-1">
                                        <div className="font-semibold text-foreground">{group.class} - Sem {group.semester}</div>
                                        <div className="text-xs text-muted-foreground">Batch: {group.batch}</div>
                                        <div className="border-t my-2"></div>
                                        <div className="text-sm">Total Students: <span className="font-bold">{group.total}</span></div>
                                        <div className="text-sm flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-destructive" />
                                            High Risk: {group.high} ({highRiskPercent.toFixed(0)}%)
                                        </div>
                                        <div className="text-sm flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                            Medium Risk: {group.medium} ({mediumRiskPercent.toFixed(0)}%)
                                        </div>
                                         <div className="text-sm flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                            Low Risk: {group.low} ({lowRiskPercent.toFixed(0)}%)
                                        </div>
                                    </div>
                                );

                                return (
                                    <TableRow key={`${group.batch}-${group.class}-${group.semester}`} className="font-mono">
                                        <TooltipCell content={tooltipContent}>{group.batch}</TooltipCell>
                                        <TooltipCell content={tooltipContent}>{group.class}</TooltipCell>
                                        <TooltipCell content={tooltipContent} className="text-center">{group.semester}</TooltipCell>
                                        <TooltipCell content={tooltipContent} className={`text-center font-semibold rounded-l-md ${colorClass}`}>{group.high}</TooltipCell>
                                        <TooltipCell content={tooltipContent} className={`text-center font-semibold ${colorClass}`}>{group.medium}</TooltipCell>
                                        <TooltipCell content={tooltipContent} className={`text-center font-semibold rounded-r-md ${colorClass}`}>{group.low}</TooltipCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No data to display in heatmap.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            </CardContent>
        </Card>
    )
}
