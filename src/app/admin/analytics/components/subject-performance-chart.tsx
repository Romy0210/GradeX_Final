
"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Label } from "recharts";
import type { Student } from "@/lib/data";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAcademicStructure } from "@/context/academic-structure-provider";

type SubjectPerformanceChartProps = {
  data: Student[];
  filters: {
    batch: string;
    class: string;
    semester: string;
    riskLevel: string;
    gender: string;
    subject: string;
  }
};

export default function SubjectPerformanceChart({ data, filters }: SubjectPerformanceChartProps) {
  const { getSubjectsForGroup } = useAcademicStructure();

  const chartData = useMemo(() => {
    const isSubjectView = filters.subject !== 'all';

    if (isSubjectView) {
      // View: Performance of each student for the selected subject
      return data.map(student => {
        const subjectData = student.subjects?.find(s => s.subjectName === filters.subject);
        const avgMark = subjectData ? ((subjectData.internalMark1 || 0) + (subjectData.internalMark2 || 0)) / 2 : 0;
        return {
          name: student.name, // Student name on X-axis
          averageMark: avgMark, // Their mark for the subject on Y-axis
        };
      }).filter(s => s.averageMark > 0); // Only show students with marks
    } else {
      // View: Average performance for each subject in the filtered group (existing logic)
      const subjectDataMap = new Map<string, { totalMark: number; studentCount: number }>();
      const isSpecificGroupSelected = filters.batch !== 'all' && filters.class !== 'all' && filters.semester !== 'all';

      if (isSpecificGroupSelected) {
        const officialSubjects = getSubjectsForGroup(filters.batch, filters.class, filters.semester);
        officialSubjects.forEach(subject => {
          subjectDataMap.set(subject.name, { totalMark: 0, studentCount: 0 });
        });
      }

      data.forEach(student => {
        student.subjects?.forEach(subject => {
          if (!isSpecificGroupSelected && !subjectDataMap.has(subject.subjectName)) {
            subjectDataMap.set(subject.subjectName, { totalMark: 0, studentCount: 0 });
          }

          if (subjectDataMap.has(subject.subjectName)) {
            const current = subjectDataMap.get(subject.subjectName)!;
            const avgMark = ((subject.internalMark1 || 0) + (subject.internalMark2 || 0)) / 2;
            current.totalMark += avgMark;
            current.studentCount += 1;
          }
        });
      });

      return Array.from(subjectDataMap.entries())
        .map(([name, { totalMark, studentCount }]) => {
          // Create an abbreviation for the XAxis to prevent cutoff
          const words = name.split(' ');
          const abbreviation = words.length > 1 && name.length > 15
            ? words.map(w => w[0]).join('').toUpperCase()
            : name;

          return {
            name,
            abbreviation,
            averageMark: studentCount > 0 ? totalMark / studentCount : 0,
            hasData: studentCount > 0,
          };
        })
        .filter(item => item.hasData);
    }
  }, [data, filters, getSubjectsForGroup]);

  const chartConfig = {
    averageMark: {
      label: filters.subject === 'all' ? "Average Mark" : "Student's Mark",
      color: "hsl(var(--chart-1))",
    },
  };

  const isSubjectView = filters.subject !== 'all';

  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[400px] w-full text-muted-foreground">
        No subject data available for the current filter.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-[400px]">
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout={isSubjectView ? 'vertical' : 'horizontal'}
          margin={{
            top: 20,
            right: 30,
            left: isSubjectView ? 40 : 20, // More left margin for student names
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {isSubjectView ? (
            <>
              <XAxis type="number" domain={[0, 40]} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={120}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="abbreviation"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis domain={[0, 40]} />
            </>
          )}

          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={(props) => {
              // Render the raw properties carefully, falling back to standard if needed
              return (
                <ChartTooltipContent
                  {...props}
                  hideLabel={false}
                  labelFormatter={(label, payload) => {
                    // The payload contains the full 'name' and 'abbreviation'
                    // ChartTooltipContent uses `label`, which is the abbreviation here. 
                    // Let's grab the full name from the payload so it shows in the tooltip header.
                    if (payload && payload.length > 0 && payload[0].payload) {
                      return payload[0].payload.name;
                    }
                    return label;
                  }}
                />
              )
            }}
          />
          <Legend />
          <Bar dataKey="averageMark" fill="var(--color-averageMark)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

