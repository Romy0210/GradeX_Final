'use client';

import { useMemo } from 'react';
import { useStudentData } from '@/context/student-data-provider';
import StatCard from './components/stat-card';
import AtRiskPreview from './components/at-risk-preview';
import QuickActions from './components/quick-actions';
import RecentActivity from './components/recent-activity';
import AcademicGroupOverview from './components/academic-group-overview';
import RiskHeatmap from './components/risk-heatmap';
import PredictiveAlerts from './components/predictive-alerts';
import SubjectPerformanceSnapshot from './components/subject-performance-snapshot';
import CorrelationSummary from './components/correlation-summary';
import { BookCopy, GraduationCap, ShieldAlert, ShieldCheck, Shield, TrendingUp, Users } from 'lucide-react';

export default function AdminDashboard() {
  const { students } = useStudentData();

  const dashboardStats = useMemo(() => {
    const totalStudents = students.length;
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
        passingRate: 0,
        averageGpa: 0,
        highRiskPercent: 0,
        mediumRiskPercent: 0,
        lowRiskPercent: 0,
      };
    }

    const highRiskCount = students.filter((s) => s.riskLevel === 'High').length;
    const mediumRiskCount = students.filter((s) => s.riskLevel === 'Medium').length;
    const lowRiskCount = students.filter((s) => s.riskLevel === 'Low').length;
    const passingCount = students.filter((s) => s.outcome === 'Pass').length;

    return {
      totalStudents,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      passingRate: (passingCount / totalStudents) * 100,
      averageGpa: students.reduce((acc, s) => acc + s.gpa, 0) / totalStudents,
      highRiskPercent: (highRiskCount / totalStudents) * 100,
      mediumRiskPercent: (mediumRiskCount / totalStudents) * 100,
      lowRiskPercent: (lowRiskCount / totalStudents) * 100,
    };
  }, [students]);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Executive overview of student performance and risk factors.
          </p>
        </div>
      </div>
      
      {/* Executive KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={dashboardStats.totalStudents.toString()}
          icon={<Users />}
          trendValue="+2 this week"
        />
        <StatCard
          title="High-Risk Students"
          value={dashboardStats.highRiskCount.toString()}
          icon={<ShieldAlert />}
          description={`${dashboardStats.highRiskPercent.toFixed(1)}% of students`}
          trendValue="-1 from yesterday"
          trendDirection="down"
        />
        <StatCard
          title="Medium Risk Students"
          value={dashboardStats.mediumRiskCount.toString()}
          icon={<Shield />}
          description={`${dashboardStats.mediumRiskPercent.toFixed(1)}% of students`}
        />
        <StatCard
          title="Low Risk Students"
          value={dashboardStats.lowRiskCount.toString()}
          icon={<ShieldCheck />}
          description={`${dashboardStats.lowRiskPercent.toFixed(1)}% of students`}
        />
        <StatCard
          title="Overall Passing Rate"
          value={`${dashboardStats.passingRate.toFixed(1)}%`}
          icon={<TrendingUp />}
          progress={dashboardStats.passingRate}
        />
        <StatCard
          title="Average GPA"
          value={dashboardStats.averageGpa.toFixed(2)}
          icon={<GraduationCap />}
          progress={(dashboardStats.averageGpa / 10) * 100}
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 auto-rows-min">
        <div className="lg:col-span-2 space-y-4 md:space-y-8">
            <AcademicGroupOverview students={students} />
            <RiskHeatmap students={students} />
        </div>
         <div className="lg:col-span-1 space-y-4 md:space-y-8">
            <PredictiveAlerts />
            <CorrelationSummary students={students} />
        </div>
         <div className="lg:col-span-3">
             <SubjectPerformanceSnapshot students={students} />
        </div>
         <div className="lg:col-span-2">
            <AtRiskPreview data={students} />
        </div>
        <div className="lg:col-span-1 space-y-4 md:space-y-8">
            <RecentActivity />
            <QuickActions />
        </div>
      </div>
    </>
  );
}
