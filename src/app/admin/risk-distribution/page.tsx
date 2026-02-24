"use client";

import RiskDistributionChart from "../dashboard/components/risk-distribution-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useStudentData } from "@/context/student-data-provider";

export default function RiskDistributionPage() {
  const { students } = useStudentData();

  return (
    <>
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Risk Distribution</h1>
          <p className="text-muted-foreground">
            A visual breakdown of student risk levels.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>
                Pie chart showing the proportion of students in each risk category.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center pt-6">
            <RiskDistributionChart data={students} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
