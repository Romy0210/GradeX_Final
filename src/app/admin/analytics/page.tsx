

"use client";

import { useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import RiskDistributionChart from "../dashboard/components/risk-distribution-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStudentData } from "@/context/student-data-provider";
import GpaVsAttendanceChart from "./components/gpa-vs-attendance-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileDown, ChevronDown, FileText, Loader2 } from "lucide-react";
import { useUser } from "@/firebase/auth/use-user";
import { useToast } from "@/hooks/use-toast";
import { exportStandardReport } from "@/lib/export";
import GenderDistributionChart from "./components/gender-distribution-chart";
import SubjectPerformanceChart from "./components/subject-performance-chart";
import { useAcademicStructure } from "@/context/academic-structure-provider";
import type { Student } from "@/lib/data";
import ReportLayout from "./components/report-layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useActivityLog } from "@/context/activity-log-provider";


export default function AnalyticsPage() {
  const { students } = useStudentData();
  const { userProfile } = useUser();
  const { toast } = useToast();
  const { getSubjectsForGroup } = useAcademicStructure();
  const { logActivity } = useActivityLog();

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [filters, setFilters] = useState({
    batch: "all",
    class: "all",
    semester: "all",
    riskLevel: "all",
    gender: "all",
    subject: "all",
  });

  const batches = useMemo(() => ["all", ...new Set(students.map(s => s.batch))], [students]);
  const classes = useMemo(() => ["all", ...new Set(students.map(s => s.class))], [students]);
  const semesters = useMemo(() => ["all", ...new Set(students.map(s => s.semester))], [students]);
  const dynamicSubjects = useMemo(() => {
    if (filters.batch === 'all' || filters.class === 'all' || filters.semester === 'all') {
      return [];
    }
    const subjects = getSubjectsForGroup(filters.batch, filters.class, filters.semester);
    return ["all", ...subjects.map(s => s.name)];
  }, [filters.batch, filters.class, filters.semester, getSubjectsForGroup]);

  const riskLevels = ["all", "Low", "Medium", "High"];
  const genders = ["all", "Male", "Female"];
  
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterName]: value };
      if (['batch', 'class', 'semester'].includes(filterName)) {
        newFilters.subject = 'all';
      }
      return newFilters;
    });
  }

  const filteredData = useMemo(() => {
    // Start with basic filters (batch, class, semester, gender)
    let filteredStudents = students.filter(student => {
        const batchMatch = filters.batch === 'all' || student.batch === filters.batch;
        const classMatch = filters.class === 'all' || student.class === filters.class;
        const semesterMatch = filters.semester === 'all' || student.semester === filters.semester;
        const genderMatch = filters.gender === 'all' || student.gender === filters.gender;
        return batchMatch && classMatch && semesterMatch && genderMatch;
    });

    // Handle the subject filter. This is the main change.
    if (filters.subject !== 'all') {
        filteredStudents = filteredStudents.map(student => {
            // Find the specific subject and its analysis
            const targetSubject = student.subjects?.find(s => s.subjectName === filters.subject);
            const subjectAnalysis = student.subjectAnalyses?.find(sa => sa.subjectName === filters.subject);

            // If the student doesn't have data for this subject, filter them out.
            if (!targetSubject || !subjectAnalysis) {
                return null;
            }

            // Create a new student object with ONLY the filtered subject
            // and the subject-specific risk/outcome/grade at the top level.
            return {
                ...student,
                subjects: [targetSubject], // CRITICAL: only include the one subject
                riskLevel: subjectAnalysis.riskLevel,
                outcome: subjectAnalysis.outcome,
                gradeCategory: subjectAnalysis.gradeCategory,
            };
        }).filter((s): s is Student => s !== null);
    }
    
    // Finally, apply the risk level filter on the (potentially modified) students.
    return filteredStudents.filter(student => {
        return filters.riskLevel === 'all' || student.riskLevel === filters.riskLevel;
    });

  }, [students, filters]);

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no students matching the current filters.",
      });
      return;
    }

    const activeFilters: Record<string, string> = {};
    if (filters.batch !== 'all') activeFilters['Batch'] = filters.batch;
    if (filters.class !== 'all') activeFilters['Class'] = filters.class;
    if (filters.semester !== 'all') activeFilters['Semester'] = filters.semester;
    if (filters.riskLevel !== 'all') activeFilters['Risk Level'] = filters.riskLevel;
    if (filters.gender !== 'all') activeFilters['Gender'] = filters.gender;
    if (filters.subject !== 'all') activeFilters['Subject'] = filters.subject;
    
    const fileName = `GradeX_Report_${new Date().toISOString().split('T')[0]}.csv`;

    exportStandardReport(filteredData, { generatedBy: userProfile?.email, filters: activeFilters }, fileName);
    
    logActivity("EXPORT", `Exported analytics report with ${filteredData.length} students to CSV.`);

    toast({
      title: "Export Started",
      description: `A report with ${filteredData.length} students is being downloaded as a CSV.`,
    });
  };

  const handleExportPdf = async () => {
    if (filteredData.length === 0) {
        toast({ title: "No Data to Export", description: "Cannot generate a PDF with no data matching the current filters." });
        return;
    }
    if (isExportingPdf) return;

    setIsExportingPdf(true);
    toast({ title: "Generating PDF Report...", description: "This may take a moment. Please wait." });

    const renderTarget = document.getElementById('pdf-render-target');
    if (!renderTarget) {
        toast({ variant: "destructive", title: "Export Failed", description: "Could not find the PDF render target." });
        setIsExportingPdf(false);
        return;
    }

    try {
        const originalTheme = document.documentElement.className;
        document.documentElement.classList.add('light'); // Force light theme for printing

        const pdf = new jsPDF('p', 'mm', 'a4');
        const totalPages = 1 + filteredData.length; // 1 summary page + 1 page per student
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // --- Page 1: Summary Page ---
        const summaryRoot = createRoot(renderTarget);
        await new Promise<void>(resolve => {
            summaryRoot.render(
                <ReportLayout data={filteredData} filters={filters} user={userProfile} mode="summary-only" />
            );
            setTimeout(resolve, 100);
        });

        const summaryCanvas = await html2canvas(renderTarget, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        summaryRoot.unmount();
        const summaryImgData = summaryCanvas.toDataURL('image/png');
        const summaryImgProps = pdf.getImageProperties(summaryImgData);
        const summaryImgHeight = (summaryImgProps.height * pdfWidth) / summaryImgProps.width;

        pdf.addImage(summaryImgData, 'PNG', 0, 0, pdfWidth, summaryImgHeight > pdfHeight ? pdfHeight : summaryImgHeight);
        
        // --- Subsequent Pages: One per student ---
        for (let i = 0; i < filteredData.length; i++) {
            const student = filteredData[i];
            pdf.addPage();
            
            const studentRoot = createRoot(renderTarget);
            await new Promise<void>(resolve => {
                studentRoot.render(
                    <ReportLayout data={[student]} filters={filters} user={userProfile} mode="student-only" />
                );
                setTimeout(resolve, 100);
            });
            
            const studentCanvas = await html2canvas(renderTarget, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            studentRoot.unmount();
            const studentImgData = studentCanvas.toDataURL('image/png');
            const studentImgProps = pdf.getImageProperties(studentImgData);
            const studentImgHeight = (studentImgProps.height * pdfWidth) / studentImgProps.width;
            
            pdf.addImage(studentImgData, 'PNG', 0, 0, pdfWidth, studentImgHeight > pdfHeight ? pdfHeight : studentImgHeight);
        }

        const fileName = `GradeX_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        logActivity("EXPORT", `Exported analytics report with ${filteredData.length} students to PDF.`);

        toast({ title: 'PDF Export Complete', description: `Report downloaded as ${fileName}.` });

        document.documentElement.className = originalTheme; // Restore original theme

    } catch (error) {
        console.error("PDF Generation Error:", error);
        toast({ variant: 'destructive', title: 'Export Failed', description: 'An error occurred during PDF generation.' });
        document.documentElement.className = (document.documentElement.className.replace('light', ''));
    } finally {
        setIsExportingPdf(false);
    }
};
  
  const subjectChartTitle = filters.subject === 'all' 
    ? "Average Subject Performance" 
    : `Student Performance in ${filters.subject}`;

  const subjectChartDescription = filters.subject === 'all'
    ? "Average marks obtained in each subject across filtered students."
    : `Individual student marks for the selected subject.`;


  return (
    <>
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            A visual breakdown of student risk and performance metrics.
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
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Download CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf} disabled={isExportingPdf}>
                    {isExportingPdf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    <span>{isExportingPdf ? "Generating..." : "Download PDF"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter analytics by academic group, risk, gender, or subject.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batch-filter">Batch</Label>
              <Select value={filters.batch} onValueChange={(value) => handleFilterChange('batch', value)}>
                <SelectTrigger id="batch-filter">
                  <SelectValue placeholder="Select Batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch, index) => <SelectItem key={`${batch}-${index}`} value={batch}>{batch === 'all' ? 'All Batches' : batch}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="class-filter">Class / Department</Label>
              <Select value={filters.class} onValueChange={(value) => handleFilterChange('class', value)}>
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls, index) => <SelectItem key={`${cls}-${index}`} value={cls}>{cls === 'all' ? 'All Classes' : cls}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="semester-filter">Semester</Label>
              <Select value={filters.semester} onValueChange={(value) => handleFilterChange('semester', value)}>
                <SelectTrigger id="semester-filter">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((sem, index) => <SelectItem key={`${sem}-${index}`} value={sem}>{sem === 'all' ? 'All Semesters' : sem}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-filter">Subject</Label>
              <Select value={filters.subject} onValueChange={(value) => handleFilterChange('subject', value)} disabled={dynamicSubjects.length === 0}>
                <SelectTrigger id="subject-filter">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicSubjects.map((subject, index) => <SelectItem key={`${subject}-${index}`} value={subject}>{subject === 'all' ? 'All Subjects' : subject}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="risk-filter">Risk Level</Label>
              <Select value={filters.riskLevel} onValueChange={(value) => handleFilterChange('riskLevel', value)}>
                <SelectTrigger id="risk-filter">
                  <SelectValue placeholder="Select Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  {riskLevels.map((risk, index) => <SelectItem key={`${risk}-${index}`} value={risk}>{risk === 'all' ? 'All Risk Levels' : risk}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender-filter">Gender</Label>
              <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                <SelectTrigger id="gender-filter">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((gender, index) => <SelectItem key={`${gender}-${index}`} value={gender}>{gender === 'all' ? 'All Genders' : gender}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>
                Proportion of students in each risk category for the selected scope.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center pt-6">
            <RiskDistributionChart data={filteredData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
            <CardDescription>
                Breakdown of students by gender for the selected scope.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center pt-6">
            <GenderDistributionChart data={filteredData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>GPA vs. Attendance</CardTitle>
            <CardDescription>
                Scatter plot of overall GPA against attendance, colored by risk level.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <GpaVsAttendanceChart data={filteredData} />
          </CardContent>
        </Card>
         <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{subjectChartTitle}</CardTitle>
            <CardDescription>
                {subjectChartDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SubjectPerformanceChart data={filteredData} filters={filters} />
          </CardContent>
        </Card>
      </div>
      
      {/* Hidden container for on-screen previewing of the printable report */}
       <div className="printable-area" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '210mm', height: '297mm' }}>
        <ReportLayout data={filteredData} filters={filters} user={userProfile} />
      </div>

      {/* Hidden container for rendering individual PDF pages */}
      <div id="pdf-render-target" style={{ position: 'absolute', left: '-9999px', top: 'auto' }}></div>
    </>
  );
}
