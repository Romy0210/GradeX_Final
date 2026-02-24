'use client';

import { useState, useMemo } from 'react';
import { useStudentData } from '@/context/student-data-provider';
import { useAcademicStructure } from '@/context/academic-structure-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileDown, ChevronDown } from 'lucide-react';
import { AttendanceTable } from './components/attendance-table';
import { AssignmentsTable } from './components/assignments-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/context/activity-log-provider';
import { exportAttendanceReport, exportAssignmentsReport } from '@/lib/export';


export type MonitoredData = {
    studentId: string;
    studentName: string;
    studentEmail: string;
    subjectId: string;
    subjectName: string;
    batch: string;
    class: string;
    semester: string;
    attendancePercentage: number;
    totalAssignments: number;
    completedAssignments: number;
};

export default function AcademicMonitoringPage() {
    const { students } = useStudentData();
    const { getSubjectsForGroup, configurations } = useAcademicStructure();
    
    const [filters, setFilters] = useState({
        batch: 'all',
        class: 'all',
        semester: 'all',
        subject: 'all',
        search: '',
    });
    const [activeTab, setActiveTab] = useState('attendance');
    const { userProfile } = useUser();
    const { logActivity } = useActivityLog();
    const { toast } = useToast();


    const handleFilterChange = (filterName: string, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const uniqueBatches = useMemo(() => ['all', ...new Set(configurations.map(c => c.batch))], [configurations]);
    const uniqueClasses = useMemo(() => ['all', ...new Set(configurations.map(c => c.class))], [configurations]);
    const uniqueSemesters = useMemo(() => ['all', ...new Set(configurations.map(c => c.semester))], [configurations]);
    
    const uniqueSubjects = useMemo(() => {
        if (filters.batch === 'all' || filters.class === 'all' || filters.semester === 'all') {
            const allSubjects = configurations.flatMap(c => c.subjects.map(s => s.name));
            return ['all', ...new Set(allSubjects)];
        }
        const subjects = getSubjectsForGroup(filters.batch, filters.class, filters.semester);
        return ['all', ...subjects.map(s => s.name)];
    }, [filters.batch, filters.class, filters.semester, getSubjectsForGroup, configurations]);
    
    const flattenedData = useMemo((): MonitoredData[] => {
        const data: MonitoredData[] = [];
        students.forEach(student => {
            (student.subjects || []).forEach(subject => {
                data.push({
                    studentId: student.id,
                    studentName: student.name,
                    studentEmail: student.email,
                    subjectId: subject.subjectId,
                    subjectName: subject.subjectName,
                    batch: student.batch,
                    class: student.class,
                    semester: student.semester,
                    attendancePercentage: subject.subjectAttendancePercentage || 0,
                    totalAssignments: subject.totalAssignments || 0,
                    completedAssignments: subject.completedAssignments || 0,
                });
            });
        });
        return data;
    }, [students]);

    const filteredData = useMemo(() => {
        return flattenedData.filter(item => {
            const searchLower = filters.search.toLowerCase();
            const searchMatch = filters.search === '' || 
                                item.studentName.toLowerCase().includes(searchLower) ||
                                item.studentId.toLowerCase().includes(searchLower);
            const batchMatch = filters.batch === 'all' || item.batch === filters.batch;
            const classMatch = filters.class === 'all' || item.class === filters.class;
            const semesterMatch = filters.semester === 'all' || item.semester === filters.semester;
            const subjectMatch = filters.subject === 'all' || item.subjectName === filters.subject;

            return searchMatch && batchMatch && classMatch && semesterMatch && subjectMatch;
        });
    }, [flattenedData, filters]);

    const handleExportCsv = () => {
        if (filteredData.length === 0) {
          toast({
            title: "No Data to Export",
            description: "There are no records matching the current filters.",
          });
          return;
        }
    
        const activeFilters: Record<string, string> = {};
        if (filters.batch !== 'all') activeFilters['Batch'] = filters.batch;
        if (filters.class !== 'all') activeFilters['Class'] = filters.class;
        if (filters.semester !== 'all') activeFilters['Semester'] = filters.semester;
        if (filters.subject !== 'all') activeFilters['Subject'] = filters.subject;
        if (filters.search) activeFilters['Search'] = filters.search;
        
        const fileName = `GradeX_Monitoring_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
        const metadata = { generatedBy: userProfile?.email, filters: activeFilters };
    
        if (activeTab === 'attendance') {
          exportAttendanceReport(filteredData, metadata, fileName);
        } else {
          exportAssignmentsReport(filteredData, metadata, fileName);
        }
        
        logActivity("EXPORT", `Exported ${activeTab} monitoring report with ${filteredData.length} records to CSV.`);
    
        toast({
          title: "Export Started",
          description: `A report with ${filteredData.length} records is being downloaded.`,
        });
    };

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Academic Monitoring</h1>
                    <p className="text-muted-foreground">
                        View attendance and assignment data to identify at-risk students.
                    </p>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export Data
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={handleExportCsv}>
                            Download as CSV
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>
                        Filter monitoring data by academic group, subject, or student.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                     <div className="space-y-2 lg:col-span-1">
                        <Label htmlFor="search-filter">Search Student</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="search-filter" 
                                placeholder="Name or Roll No..." 
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="batch-filter">Batch</Label>
                        <Select value={filters.batch} onValueChange={(v) => handleFilterChange('batch', v)}><SelectTrigger id="batch-filter"><SelectValue placeholder="Select Batch"/></SelectTrigger><SelectContent>{uniqueBatches.map(b => <SelectItem key={b} value={b}>{b === 'all' ? 'All Batches' : b}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="class-filter">Class / Department</Label>
                        <Select value={filters.class} onValueChange={(v) => handleFilterChange('class', v)}><SelectTrigger id="class-filter"><SelectValue placeholder="Select Class"/></SelectTrigger><SelectContent>{uniqueClasses.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All Classes' : c}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="semester-filter">Semester</Label>
                        <Select value={filters.semester} onValueChange={(v) => handleFilterChange('semester', v)}><SelectTrigger id="semester-filter"><SelectValue placeholder="Select Semester"/></SelectTrigger><SelectContent>{uniqueSemesters.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Semesters' : s}</SelectItem>)}</SelectContent></Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="subject-filter">Subject</Label>
                        <Select value={filters.subject} onValueChange={(v) => handleFilterChange('subject', v)}><SelectTrigger id="subject-filter"><SelectValue placeholder="Select Subject"/></SelectTrigger><SelectContent>{uniqueSubjects.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</SelectItem>)}</SelectContent></Select>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="attendance" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="attendance">Attendance Monitoring</TabsTrigger>
                    <TabsTrigger value="assignments">Assignment Monitoring</TabsTrigger>
                </TabsList>
                <TabsContent value="attendance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Overview</CardTitle>
                            <CardDescription>Read-only view of student attendance records. Risk is high below 75%.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AttendanceTable data={filteredData} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="assignments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignments Overview</CardTitle>
                            <CardDescription>Read-only view of assignment completion. Risk is high below 40% completion.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AssignmentsTable data={filteredData} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    );
}
