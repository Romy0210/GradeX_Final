'use client';

import { useMemo } from 'react';
import { useStudentData } from '@/context/student-data-provider';
import StatCard from './components/stat-card';
import AtRiskPreview from './components/at-risk-preview';
import QuickActions from './components/quick-actions';
import RecentActivity from './components/recent-activity';
import AcademicGroupOverview from './components/academic-group-overview';
import RiskHeatmap from './components/risk-heatmap';
import SubjectPerformanceSnapshot from './components/subject-performance-snapshot';
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

    const isHighRisk = (s: typeof students[0]) => s.riskLevel === 'High' || (s.subjectAnalyses?.some(sub => sub.riskLevel === 'High') ?? false);

    const highRiskCount = students.filter(isHighRisk).length;
    const mediumRiskCount = students.filter((s) => !isHighRisk(s) && s.riskLevel === 'Medium').length;
    const lowRiskCount = students.filter((s) => !isHighRisk(s) && s.riskLevel === 'Low').length;
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
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-border/50 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">Administrative Control Center</h1>
          <p className="text-muted-foreground font-medium">
            Executive overview of student performance, emerging risk factors, and actionable insights.
          </p>
        </div>
      </div>

      {/* Executive KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-min">
        {/* Left Column - Core Academics */}
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
          <AcademicGroupOverview students={students} />
        </div>

        {/* Right Column - Actions & Activity */}
        <div className="lg:col-span-1 flex flex-col gap-6 md:gap-8">
          <QuickActions />
          <RecentActivity />
        </div>

        {/* Full Width Subject Snapshot */}
        <div className="lg:col-span-3">
          <SubjectPerformanceSnapshot students={students} />
        </div>

        {/* Bottom Row - Heatmap & Risk Preview */}
        <div className="lg:col-span-2">
          <RiskHeatmap students={students} />
        </div>
        <div className="lg:col-span-1">
          <AtRiskPreview data={students} />
        </div>
      </div>
    </>
  );
}
