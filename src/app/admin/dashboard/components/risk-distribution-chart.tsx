"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Student } from "@/lib/data";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

type RiskDistributionChartProps = {
  data: Student[];
};

export default function RiskDistributionChart({
  data,
}: RiskDistributionChartProps) {
  const riskCounts = data.reduce(
    (acc, student) => {
      acc[student.riskLevel] = (acc[student.riskLevel] || 0) + 1;
      return acc;
    },
    {} as Record<"Low" | "Medium" | "High", number>
  );

  const chartData = [
    { name: "Low", value: riskCounts.Low || 0, fill: "hsl(var(--chart-1))" },
    {
      name: "Medium",
      value: riskCounts.Medium || 0,
      fill: "hsl(var(--chart-2))",
    },
    {
      name: "High",
      value: riskCounts.High || 0,
      fill: "hsl(var(--destructive))",
    },
  ];

  const chartConfig = {
    value: {
      label: "Students",
    },
    Low: {
      label: "Low Risk",
      color: "hsl(var(--chart-1))",
    },
    Medium: {
      label: "Medium Risk",
      color: "hsl(var(--chart-2))",
    },
    High: {
      label: "High Risk",
      color: "hsl(var(--destructive))",
    },
  };

  const totalStudents = data.length;

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
            labelLine={false}
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
