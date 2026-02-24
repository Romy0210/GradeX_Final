"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Student } from "@/lib/data";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

type GenderDistributionChartProps = {
  data: Student[];
};

export default function GenderDistributionChart({ data }: GenderDistributionChartProps) {
  const genderCounts = data.reduce(
    (acc, student) => {
      acc[student.gender] = (acc[student.gender] || 0) + 1;
      return acc;
    },
    {} as Record<"Male" | "Female", number>
  );

  const chartData = [
    { name: "Male", value: genderCounts.Male || 0, fill: "hsl(var(--chart-1))" },
    { name: "Female", value: genderCounts.Female || 0, fill: "hsl(var(--chart-2))" },
  ];

  const chartConfig = {
    value: {
      label: "Students",
    },
    Male: {
      label: "Male",
      color: "hsl(var(--chart-1))",
    },
    Female: {
      label: "Female",
      color: "hsl(var(--chart-2))",
    },
  };
  
  const totalStudents = data.length;
  if (totalStudents === 0) {
    return (
        <div className="flex justify-center items-center h-[250px] text-muted-foreground">
            No data to display
        </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[250px]"
    >
      <ResponsiveContainer>
        <PieChart>
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel nameKey="name" />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={60}
            strokeWidth={2}
            stroke="hsl(var(--background))"
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              value,
            }) => {
              if (value === 0) return null;
              const RADIAN = Math.PI / 180;
              const radius = (innerRadius + outerRadius) / 2;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);

              return (
                <text
                  x={x}
                  y={y}
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                  className="fill-foreground text-xs font-bold"
                >
                  {`${((value / totalStudents) * 100).toFixed(0)}%`}
                </text>
              );
            }}
          />
          <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            verticalAlign="bottom"
            align="center"
            height={50}
            iconSize={10}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
