'use client';

import { DashboardLayout } from "@/components/dashboard-layout";
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (userProfile?.role !== 'admin') {
        router.replace('/student/dashboard');
      }
    }
  }, [user, userProfile, isLoading, router]);

  if (isLoading || !user || userProfile?.role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}
