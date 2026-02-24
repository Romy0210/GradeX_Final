'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAcademicStructure } from '@/context/academic-structure-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Subject, type SubjectConfiguration } from '@/lib/academic-structure';
import { CreateAcademicGroupDialog } from './components/create-academic-group-dialog';

export default function AcademicSubjectsPage() {
  const { configurations, getSubjectsForGroup, addOrUpdateConfiguration } = useAcademicStructure();
  const { toast } = useToast();

  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  const [currentSubjects, setCurrentSubjects] = useState<Subject[]>([]);
  const [isModified, setIsModified] = useState(false);

  const uniqueBatches = useMemo(() => [...new Set(configurations.map(c => c.batch))], [configurations]);
  const uniqueClasses = useMemo(() => [...new Set(configurations.map(c => c.class))], [configurations]);
  const uniqueSemesters = useMemo(() => [...new Set(configurations.map(c => c.semester))], [configurations]);
  
  useEffect(() => {
    if (selectedBatch && selectedClass && selectedSemester) {
      const subjects = getSubjectsForGroup(selectedBatch, selectedClass, selectedSemester);
      setCurrentSubjects(subjects.map(s => ({...s}))); // Create a deep copy to allow editing
      setIsModified(false);
    } else {
      setCurrentSubjects([]);
      setIsModified(false);
    }
  }, [selectedBatch, selectedClass, selectedSemester, getSubjectsForGroup, configurations]);

  const handleAddSubject = () => {
    const newId = `SUB${Date.now()}`;
    setCurrentSubjects(prev => [...prev, { id: newId, name: '', totalAssignments: 5 }]);
    setIsModified(true);
  };

  const handleRemoveSubject = (id: string) => {
    setCurrentSubjects(prev => prev.filter(s => s.id !== id));
    setIsModified(true);
  };

  const handleSubjectChange = (id: string, field: 'id' | 'name' | 'totalAssignments', value: string | number) => {
    setCurrentSubjects(prev => prev.map(s => {
        if (s.id === id) {
            let processedValue = value;
            if (field === 'totalAssignments') {
                const numValue = Number(value);
                processedValue = isNaN(numValue) ? 0 : Math.max(0, Math.min(5, numValue));
            }
            return { ...s, [field]: processedValue };
        }
        return s;
    }));
    setIsModified(true);
  };

  const handleSaveChanges = () => {
    if (!selectedBatch || !selectedClass || !selectedSemester) {
        toast({ variant: 'destructive', title: 'Selection Missing', description: 'Please select a batch, class, and semester.' });
        return;
    }

    // Validate subjects
    for (const subject of currentSubjects) {
        if (!subject.id.trim() || !subject.name.trim()) {
            toast({ variant: 'destructive', title: 'Invalid Subject', description: 'Subject ID and Name cannot be empty.' });
            return;
        }
        if (subject.totalAssignments < 0 || subject.totalAssignments > 5) {
            toast({ variant: 'destructive', title: 'Invalid Assignment Count', description: `Total assignments for ${subject.name} must be between 0 and 5.` });
            return;
        }
    }
    const uniqueIds = new Set(currentSubjects.map(s => s.id));
    if(uniqueIds.size !== currentSubjects.length) {
        toast({ variant: 'destructive', title: 'Duplicate ID', description: 'Subject IDs must be unique within this group.' });
        return;
    }


    const newConfig: SubjectConfiguration = {
      id: `${selectedBatch}-${selectedClass}-${selectedSemester}`,
      batch: selectedBatch,
      class: selectedClass,
      semester: selectedSemester,
      subjects: currentSubjects,
    };

    addOrUpdateConfiguration(newConfig);
    setIsModified(false);
    toast({ title: 'Subjects Saved', description: 'The subject list has been updated.' });
  };


  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Subject Manager</h1>
          <p className="text-muted-foreground">
            Configure subjects and assignment counts for each academic group.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Select Academic Group</CardTitle>
            <CardDescription>Choose a batch, class, and semester to manage their subjects.</CardDescription>
          </div>
          <CreateAcademicGroupDialog />
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger><SelectValue placeholder="Select Batch" /></SelectTrigger>
                <SelectContent>
                  {uniqueBatches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class / Department</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                <SelectContent>
                  {uniqueSemesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
        </CardContent>
      </Card>
      
      {selectedBatch && selectedClass && selectedSemester && (
        <Card>
            <CardHeader>
                <CardTitle>Manage Subjects</CardTitle>
                <CardDescription>
                    Add, edit, or remove subjects for {selectedBatch} - {selectedClass} - Semester {selectedSemester}.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {currentSubjects.length > 0 ? (
                    currentSubjects.map(subject => (
                        <div key={subject.id} className="flex items-center gap-4 p-2 border rounded-lg">
                           <div className="grid grid-cols-3 gap-4 flex-1">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`sub-id-${subject.id}`}>Subject ID</Label>
                                    <Input id={`sub-id-${subject.id}`} value={subject.id} onChange={e => handleSubjectChange(subject.id, 'id', e.target.value)} placeholder="e.g., CS601" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`sub-name-${subject.id}`}>Subject Name</Label>
                                    <Input id={`sub-name-${subject.id}`} value={subject.name} onChange={e => handleSubjectChange(subject.id, 'name', e.target.value)} placeholder="e.g., Data Structures" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`sub-assign-${subject.id}`}>Total Assignments</Label>
                                    <Input 
                                        id={`sub-assign-${subject.id}`} 
                                        type="number"
                                        min={0}
                                        max={5}
                                        value={subject.totalAssignments} 
                                        onChange={e => handleSubjectChange(subject.id, 'totalAssignments', e.target.value)} 
                                        placeholder="0-5" 
                                    />
                                </div>
                           </div>
                           <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveSubject(subject.id)}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground text-center py-4">No subjects configured for this group yet.</p>
                )}

                 <Button variant="outline" size="sm" onClick={handleAddSubject}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Subject
                 </Button>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveChanges} disabled={!isModified}>Save Changes</Button>
            </CardFooter>
        </Card>
      )}
    </>
  );
}
