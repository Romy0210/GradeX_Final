'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentData } from '@/context/student-data-provider';
import { useAcademicStructure } from '@/context/academic-structure-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Upload, AlertTriangle, ListChecks, CheckCircle, ChevronRight } from 'lucide-react';
import type { Student } from '@/lib/data';
import Link from 'next/link';
import { CreateAcademicGroupDialog } from '../../subjects/components/create-academic-group-dialog';
import { useActivityLog } from '@/context/activity-log-provider';

// New simplified CSV structure
const REQUIRED_HEADERS = [
    'rollNumber', 'fullName', 'email', 'bloodGroup', 'age', 'gender', 'phoneNumber', 'educationalBackground'
];

export default function BulkUploadPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { students, addStudents } = useStudentData();
    const { getSubjectsForGroup } = useAcademicStructure();
    const { logActivity } = useActivityLog();
    
    const [batch, setBatch] = useState('');
    const [className, setClassName] = useState('');
    const [semester, setSemester] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [validationResult, setValidationResult] = useState<{ duplicates: string[], malformed: number } | null>(null);
    const [studentsToUpload, setStudentsToUpload] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'text/csv') {
                toast({
                    variant: 'destructive',
                    title: 'Invalid File Type',
                    description: 'Please upload a CSV file.',
                });
                return;
            }
            setFile(selectedFile);
            setValidationResult(null);
            setStudentsToUpload([]);
        }
    };
    
    const parseCSV = (csvText: string): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());

            const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                return reject(new Error(`CSV is missing required headers: ${missingHeaders.join(', ')}`));
            }
            
            const data: any[] = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i]) continue;
                const values = lines[i].split(',');
                const entry: any = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index]?.trim();
                });
                data.push(entry);
            }
            resolve(data);
        });
    };

    const handleValidation = async () => {
        if (!file) return;
        setIsUploading(true);

        try {
            const text = await file.text();
            const parsedData = await parseCSV(text);

            const existingRollNumbers = new Set(students.map(s => s.id));
            const newRollNumbersInFile = new Set<string>();
            
            const duplicates: string[] = [];
            let malformedCount = 0;

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // First pass: filter out malformed rows
            const wellFormedStudents = parsedData.filter(student => {
                const isWellFormed = 
                    student.rollNumber &&
                    student.fullName &&
                    student.email && emailRegex.test(student.email) &&
                    student.gender && ['Male', 'Female'].includes(student.gender) &&
                    student.age && !isNaN(parseInt(student.age, 10));
                
                if (!isWellFormed) {
                    malformedCount++;
                }
                return isWellFormed;
            });

            // Second pass: find duplicates among well-formed rows
            const studentsToProcess = wellFormedStudents.filter(student => {
                const isDuplicateInFile = newRollNumbersInFile.has(student.rollNumber);
                newRollNumbersInFile.add(student.rollNumber);

                const isDuplicateInDb = existingRollNumbers.has(student.rollNumber);

                if (isDuplicateInFile || isDuplicateInDb) {
                    duplicates.push(student.rollNumber);
                    return false;
                }
                return true;
            });
            
            const uniqueDuplicates = [...new Set(duplicates)];
            
            setValidationResult({ duplicates: uniqueDuplicates, malformed: malformedCount });
            setStudentsToUpload(studentsToProcess);
            
            if (uniqueDuplicates.length > 0 || malformedCount > 0) {
                setIsUploading(false); // Stop here and show confirmation dialog
            } else {
                // No issues, proceed directly. `isUploading` is kept true until upload finishes.
                await proceedWithUpload(studentsToProcess);
            }

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Validation Failed',
                description: error.message,
            });
            setIsUploading(false);
        }
    };
    
    /**
     * This function now creates student records with assigned subjects but empty academic data.
     * The analysis part is removed and will be triggered later after manual data entry.
     * @param {any[]} studentsToProcess - The validated list of students to upload.
     */
    const proceedWithUpload = async (studentsToProcess: any[]) => {
        if (studentsToProcess.length === 0) {
            toast({ title: "No new students to upload." });
            setIsUploading(false);
            setValidationResult(null); // Close the dialog if it was open
            return;
        }

        setIsUploading(true); // Ensure spinner is running
        toast({
            title: `Creating ${studentsToProcess.length} Student Records`,
            description: 'Assigning subjects based on academic group. Please wait.',
        });

        try {
            // Get standard subjects for the selected academic group
            const standardSubjects = getSubjectsForGroup(batch, className, semester);
            if (standardSubjects.length === 0) {
                throw new Error(`No subjects are configured for ${batch} - ${className} - Semester ${semester}. Please configure them in the Subjects page.`);
            }

            // Create final Student objects
            const finalStudents: Student[] = studentsToProcess.map((s, index) => {
                const newSubjects = standardSubjects.map(standardSub => ({
                    subjectId: standardSub.id,
                    subjectName: standardSub.name,
                    internalMark1: 0,
                    internalMark2: 0,
                    totalAssignments: standardSub.totalAssignments,
                    completedAssignments: 0,
                    subjectAttendancePercentage: 100,
                }));

                return {
                    id: s.rollNumber,
                    name: s.fullName,
                    email: s.email,
                    bloodGroup: s.bloodGroup || 'N/A',
                    age: parseInt(s.age, 10),
                    gender: s.gender,
                    phone: s.phoneNumber || '',
                    educationalBackground: s.educationalBackground || '',
                    batch: batch,
                    class: className,
                    semester: semester,
                    profilePhoto: `student-${(students.length + index % 5) + 1}`,
                    
                    // Initialize academic data as empty/default
                    gpa: 0,
                    subjects: newSubjects,
                    overallAverageMarkPercentage: 0,
                    attendancePercentage: 100,
                    assignmentCompletion: 0,
                    pendingAssignments: newSubjects.reduce((acc, sub) => acc + sub.totalAssignments, 0),
                    assignmentCompletionPercentage: 0,

                    // Set initial "Not Calculated" AI prediction values.
                    riskLevel: 'Medium', // Default placeholder
                    outcome: 'Pass', // Default placeholder
                    gradeCategory: 'N/A',
                    academicRecommendations: '',
                    behavioralRecommendations: '',
                    interventionRecommendations: '',
                    subjectAnalyses: [],
                    subjectRecommendations: [],
                };
            });

            // Add new students to the "database"
            addStudents(finalStudents);
            
            logActivity(
                "BULK_UPLOAD",
                `Bulk upload of ${finalStudents.length} students to ${batch} - ${className} - Sem ${semester}.`
            );

            toast({
                title: 'Upload Successful',
                description: `${finalStudents.length} new student records created. You can now edit each student to add their academic performance data.`,
            });
            router.push('/admin/students');

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: error.message,
            });
        } finally {
            setIsUploading(false);
            setValidationResult(null); // Ensure dialog is closed
        }
    };

    const isFormValid = batch && className && semester && file;

    return (
    <>
       <div className="flex items-center justify-between mb-4">
        <nav className="flex items-center text-sm text-muted-foreground">
            <Link href="/admin/students" className="hover:text-foreground">Students</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="font-medium text-foreground">Bulk Upload</span>
        </nav>
      </div>
        <Card className="max-w-3xl mx-auto">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>Bulk Student Upload</CardTitle>
                    <CardDescription>Upload a CSV file with student identity data for a specific academic group. Academic performance data must be added later.</CardDescription>
                </div>
                <CreateAcademicGroupDialog />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="batch">Batch (e.g., 2023-2027)</Label>
                        <Input id="batch" value={batch} onChange={e => setBatch(e.target.value)} placeholder="2023-2027" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="class">Class / Department</Label>
                        <Input id="class" value={className} onChange={e => setClassName(e.target.value)} placeholder="Computer Science" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Input id="semester" value={semester} onChange={e => setSemester(e.target.value)} placeholder="6" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="file-upload">Student Identity File (CSV)</Label>
                    <div 
                        className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="text-center">
                            <Upload className="mx-auto h-10 w-10 text-muted-foreground"/>
                            <p className="mt-2 text-sm text-muted-foreground">{file ? file.name : 'Click to select a CSV file'}</p>
                            <p className="mt-1 text-xs text-muted-foreground/80">Required columns: {REQUIRED_HEADERS.join(', ')}</p>
                        </div>
                    </div>
                    <Input id="file-upload" type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                 </div>
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4">
                <Button onClick={handleValidation} disabled={!isFormValid || isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Processing...' : 'Validate & Upload'}
                </Button>
                {validationResult && !isUploading && (
                    <Alert variant={validationResult.duplicates.length > 0 || validationResult.malformed > 0 ? "destructive" : "default"}>
                        <div className="flex items-start gap-3">
                           {validationResult.duplicates.length > 0 || validationResult.malformed > 0 ? <AlertTriangle className="h-5 w-5 mt-0.5" /> : <CheckCircle className="h-5 w-5 mt-0.5" />}
                            <div className="flex-1">
                                <AlertTitle>Validation Complete</AlertTitle>
                                <AlertDescription>
                                    {validationResult.duplicates.length === 0 && validationResult.malformed === 0 
                                    ? "No issues found. Upload will proceed."
                                    : `Found ${validationResult.duplicates.length} duplicate roll numbers and ${validationResult.malformed} malformed rows.`
                                    }
                                </AlertDescription>
                            </div>
                        </div>
                    </Alert>
                )}
            </CardFooter>
        </Card>
        
        <AlertDialog open={validationResult != null && (validationResult.duplicates.length > 0 || validationResult.malformed > 0) && !isUploading}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Validation Issues Found</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div>
                        <div>The uploaded file contains {validationResult?.duplicates.length} duplicate roll numbers and {validationResult?.malformed} malformed rows.</div>
                        <div className="mt-2">Would you like to skip these records and upload the remaining {studentsToUpload.length} valid students?</div>
                        {validationResult && validationResult.duplicates.length > 0 && (
                            <div className="mt-4 text-xs">
                                <p className="font-bold">Duplicate Roll Numbers:</p>
                                <div className="text-muted-foreground break-all">{validationResult.duplicates.join(', ')}</div>
                            </div>
                        )}
                      </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => { setValidationResult(null); setIsUploading(false); }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => proceedWithUpload(studentsToUpload)}>Skip & Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
    );
}
