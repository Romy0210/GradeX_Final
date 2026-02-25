'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useStudentData } from "@/context/student-data-provider";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, isLoading } = useUser();
  const { students } = useStudentData();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (userProfile?.role === 'admin') {
        router.replace('/admin/dashboard');
      }
    }
  }, [user, userProfile, isLoading, router]);

  const student = students.find(s => s.authUid === user?.uid || s.id === user?.uid);
  let alertCount = 0;
  if (student) {
    if (student.riskLevel === 'High') alertCount++;
    if (student.pendingAssignments > 2) alertCount++;
    if (student.attendancePercentage < 80) alertCount++;
  }


  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return <DashboardLayout role="student" alertCount={alertCount}>{children}</DashboardLayout>;
}
