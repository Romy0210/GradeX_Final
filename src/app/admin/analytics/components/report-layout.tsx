

'use client';

import type { Student } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeXLogo } from '@/components/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'student';
}

type ReportLayoutProps = {
  data: Student[];
  filters: Record<string, string>;
  user: UserProfile | null;
  mode?: "full-report" | "summary-only" | "student-only";
};

const ReportStatCard = ({ title, value }: { title: string, value: string | number }) => (
    <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-center shadow-sm">
        <p className="text-sm text-slate-600">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
);


const groupStudentsByAcademicGroup = (students: Student[]) => {
    const groups: Record<string, { batch: string; class: string; semester: string; students: Student[] }> = {};
    
    for (const student of students) {
      const key = `${student.batch}-${student.class}-${student.semester}`;
      if (!groups[key]) {
        groups[key] = {
          batch: student.batch,
          class: student.class,
          semester: student.semester,
          students: [],
        };
      }
      groups[key].students.push(student);
    }
    
    return Object.values(groups);
};


export default function ReportLayout({ data, filters, user, mode = 'full-report' }: ReportLayoutProps) {
  const now = new Date();
  const totalStudents = data.length;

  const averageGpa = totalStudents > 0 ? (data.reduce((acc, s) => acc + s.gpa, 0) / totalStudents) : 0;
  const averageAttendance = totalStudents > 0 ? (data.reduce((acc, s) => acc + s.attendancePercentage, 0) / totalStudents) : 0;
  const averageAssignmentCompletion = totalStudents > 0 ? (data.reduce((acc, s) => acc + s.assignmentCompletionPercentage, 0) / totalStudents) : 0;

  const riskCounts = data.reduce(
    (acc, student) => {
      if (filters.subject && filters.subject !== 'all') {
        const subjectAnalysis = student.subjectAnalyses?.find(sa => sa.subjectName === filters.subject);
        const risk = subjectAnalysis?.riskLevel ?? student.riskLevel;
        acc[risk] = (acc[risk] || 0) + 1;
      } else {
        acc[student.riskLevel] = (acc[student.riskLevel] || 0) + 1;
      }
      return acc;
    },
    { High: 0, Medium: 0, Low: 0 } as Record<"Low" | "Medium" | "High", number>
  );

  const riskDistribution = [
      { level: 'High', count: riskCounts.High, percentage: totalStudents > 0 ? ((riskCounts.High / totalStudents) * 100).toFixed(1) + '%' : '0.0%' },
      { level: 'Medium', count: riskCounts.Medium, percentage: totalStudents > 0 ? ((riskCounts.Medium / totalStudents) * 100).toFixed(1) + '%' : '0.0%' },
      { level: 'Low', count: riskCounts.Low, percentage: totalStudents > 0 ? ((riskCounts.Low / totalStudents) * 100).toFixed(1) + '%' : '0.0%' },
  ];

  const genderData = data.reduce(
    (acc, student) => {
      const gender = student.gender;
      if (!acc[gender]) {
        acc[gender] = { count: 0, totalGpa: 0, totalAttendance: 0 };
      }
      acc[gender].count++;
      acc[gender].totalGpa += student.gpa;
      acc[gender].totalAttendance += student.attendancePercentage;
      return acc;
    }, {} as Record<"Male" | "Female", { count: number; totalGpa: number; totalAttendance: number }>
  );
  
  const genderPerformance = Object.entries(genderData).map(([gender, stats]) => ({
      gender,
      avgGpa: (stats.totalGpa / stats.count).toFixed(2),
      avgAttendance: (stats.totalAttendance / stats.count).toFixed(1) + '%',
  }));

  const appliedFilters = Object.entries(filters)
    .filter(([, value]) => value && value !== 'all')
    .map(([key, value]) => ({ key: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value }));
    
  const academicGroups = groupStudentsByAcademicGroup(data);

  return (
    <div 
        className="bg-white text-slate-900 font-sans"
        style={{
            width: '210mm',
            minHeight: mode === 'summary-only' ? 'auto': '297mm', // Only enforce height for student pages
            padding: '20mm 18mm',
            boxSizing: 'border-box'
        }}
    >
      <div className="report-header">
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                <GradeXLogo className="h-12 w-12 text-slate-800" />
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Academic Intelligence Report</h1>
                    <p className="text-slate-500">A data-driven summary of student performance.</p>
                </div>
            </div>
            <div className="text-right text-xs text-slate-600">
                <p><strong>Generated On:</strong> {now.toLocaleString()}</p>
                <p><strong>Generated By:</strong> {user?.email ?? 'N/A'}</p>
            </div>
        </div>

        {appliedFilters.length > 0 && (
            <Card className="bg-slate-50 border-slate-200 mb-6">
                <CardHeader className="p-4">
                    <CardTitle className="text-sm font-semibold text-slate-700">Filters Applied</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                   {appliedFilters.map(({ key, value }) => (
                      <div key={key}><span className="font-semibold text-slate-600">{key}:</span> <span className="text-slate-800">{value}</span></div>
                    ))}
                </CardContent>
            </Card>
        )}
      </div>

      {(mode === 'full-report' || mode === 'summary-only') && (
        <div className="report-main-content">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-slate-800">Executive Summary</h2>
            <div className="grid grid-cols-4 gap-4">
              <ReportStatCard title="Total Students" value={totalStudents} />
              <ReportStatCard title="Average GPA" value={averageGpa.toFixed(2)} />
              <ReportStatCard title="Avg. Attendance" value={`${averageAttendance.toFixed(1)}%`} />
              <ReportStatCard title="Avg. Assignment Completion" value={`${averageAssignmentCompletion.toFixed(1)}%`} />
            </div>
          </section>

          <Separator className="my-8" />
          
          <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8 page-break-inside-avoid">
            <div>
                <h2 className="text-2xl font-bold mb-4 text-slate-800">Risk Intelligence Summary</h2>
                <Table>
                    <TableHeader><TableRow><TableHead>Risk Level</TableHead><TableHead>Student Count</TableHead><TableHead>Percentage</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {riskDistribution.map(item => (
                            <TableRow key={item.level}><TableCell>{item.level} Risk</TableCell><TableCell>{item.count}</TableCell><TableCell>{item.percentage}</TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4 text-slate-800">Gender Performance Analysis</h2>
                <Table>
                    <TableHeader><TableRow><TableHead>Gender</TableHead><TableHead>Average GPA</TableHead><TableHead>Average Attendance</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {genderPerformance.map(item => (
                            <TableRow key={item.gender}><TableCell>{item.gender}</TableCell><TableCell>{item.avgGpa}</TableCell><TableCell>{item.avgAttendance}</TableCell></TableRow>
                        ))}
                        {genderPerformance.length === 0 && <TableRow><TableCell colSpan={3} className="text-center">No data</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
          </section>
        </div>
      )}

      {(mode === 'full-report' || mode === 'student-only') && (
        <section>
          {mode === 'student-only' && <Separator className="my-8" />}
          <h2 className="text-2xl font-bold mb-4 text-slate-800">Student Performance Details</h2>
          
          {academicGroups.length > 0 ? academicGroups.map((group) => (
             group.students.map((student) => {
                return (
                  <div key={student.id} className="student-block-for-print">
                      <div className="p-3 bg-slate-100 rounded-t-lg border-b border-slate-300 mt-6">
                          <h3 className="font-bold text-lg text-slate-700">
                              {`Batch: ${group.batch} / Class: ${group.class} / Semester: ${group.semester}`}
                          </h3>
                      </div>
                      
                      <div className="p-4 rounded-b-lg border border-t-0 border-slate-200">
                          <div className="mb-6 pb-6 border-b border-slate-200 space-y-4">
                              <div className="col-span-full">
                                  <p className="text-sm text-slate-500">Student</p>
                                  <p className="font-bold text-slate-800 text-xl">{student.name}</p>
                                  <p className="text-xs text-slate-500">Roll No: {student.id}</p>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                  <div className="p-2 bg-slate-50 rounded-lg text-center shadow-sm">
                                      <p className="text-xs text-slate-500">GPA</p>
                                      <p className="font-semibold text-lg text-slate-800">{student.gpa.toFixed(2)}</p>
                                  </div>
                                  <div className="p-2 bg-slate-50 rounded-lg text-center shadow-sm">
                                      <p className="text-xs text-slate-500">Overall Attendance</p>
                                      <p className="font-semibold text-lg text-slate-800">{student.attendancePercentage.toFixed(1)}%</p>
                                  </div>
                                  <div className="p-2 bg-slate-50 rounded-lg text-center shadow-sm">
                                      <p className="text-xs text-slate-500">Overall Grade</p>
                                      <p className="font-semibold text-lg text-slate-800">{student.gradeCategory}</p>
                                  </div>
                                  <div className="p-2 bg-slate-50 rounded-lg text-center shadow-sm">
                                      <p className="text-xs text-slate-500">Overall Risk</p>
                                      <p className="font-semibold text-lg text-slate-800">{student.riskLevel}</p>
                                  </div>
                              </div>
                          </div>
                          
                          {student.subjects && student.subjects.length > 0 ? (
                              <Table>
                                  <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Mark 1</TableHead><TableHead>Mark 2</TableHead><TableHead>Attendance</TableHead><TableHead>Risk</TableHead><TableHead>Outcome</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                      {student.subjects.map(subject => {
                                          const subjectAnalysis = student.subjectAnalyses?.find(sa => sa.subjectId === subject.subjectId);
                                          return (
                                              <TableRow key={subject.subjectId}>
                                                  <TableCell>{subject.subjectName}</TableCell>
                                                  <TableCell>{subject.internalMark1}</TableCell>
                                                  <TableCell>{subject.internalMark2}</TableCell>
                                                  <TableCell>{subject.subjectAttendancePercentage}%</TableCell>
                                                  <TableCell>{subjectAnalysis?.riskLevel ?? 'N/A'}</TableCell>
                                                  <TableCell>{subjectAnalysis?.outcome ?? 'N/A'}</TableCell>
                                                  <TableCell>{subjectAnalysis?.gradeCategory ?? 'N/A'}</TableCell>
                                              </TableRow>
                                          );
                                      })}
                                  </TableBody>
                              </Table>
                          ) : (
                              <p className="text-sm text-center text-slate-500 py-4">No subject data for this student.</p>
                          )}

                          <div className="mt-8 pt-4 border-t border-slate-200">
                            <div className="flex justify-between items-start">
                                {/* Left Signature Block */}
                                <div className="flex flex-col text-center">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-medium text-sm text-slate-600">Authorized By:</span>
                                        <div className="w-[220px] border-b border-slate-400"></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Academic Advisor / HOD Signature</p>
                                </div>
                                {/* Right Signature Block */}
                                <div className="flex flex-col text-center">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-medium text-sm text-slate-600">Parent / Guardian:</span>
                                        <div className="w-[220px] border-b border-slate-400"></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Parent / Guardian Signature</p>
                                </div>
                            </div>
                          </div>
                      </div>
                  </div>
                )
             })
          )) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-muted/20 page-break-inside-avoid">
                  <p className="text-muted-foreground">No students found for the selected criteria.</p>
              </div>
          )}
        </section>
      )}
    </div>
  );
}



    
