"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  Legend,
} from "recharts";
import type { Student } from "@/lib/data";
import {
  ChartContainer
} from "@/components/ui/chart";

type GpaVsAttendanceChartProps = {
  data: Student[];
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-background border rounded-lg shadow-lg">
        <p className="font-bold">{data.name}</p>
        <p className="text-sm text-muted-foreground">GPA: {data.gpa}</p>
        <p className="text-sm text-muted-foreground">Attendance: {data.attendancePercentage}%</p>
        <p className="text-sm text-muted-foreground">Risk: {data.riskLevel}</p>
      </div>
    );
  }
  return null;
};


export default function GpaVsAttendanceChart({ data }: GpaVsAttendanceChartProps) {
  const chartData = data.map((student) => ({
    name: student.name,
    gpa: student.gpa,
    attendancePercentage: student.attendancePercentage,
    riskLevel: student.riskLevel,
  }));
  
  const lowRiskData = chartData.filter(d => d.riskLevel === 'Low');
  const mediumRiskData = chartData.filter(d => d.riskLevel === 'Medium');
  const highRiskData = chartData.filter(d => d.riskLevel === 'High');

  const chartConfig = {
    gpa: {
      label: "GPA",
    },
    attendance: {
      label: "Attendance",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
                margin={{
                    top: 20,
                    right: 40,
                    bottom: 40,
                    left: 20,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                    type="number" 
                    dataKey="attendancePercentage" 
                    name="Attendance" 
                    unit="%"
                    domain={[0, 100]}
                >
                     <Label value="Attendance Percentage (%)" offset={-25} position="insideBottom" />
                </XAxis>
                <YAxis 
                    type="number" 
                    dataKey="gpa" 
                    name="GPA"
                    domain={[0, 10]}
                >
                     <Label value="GPA (out of 10)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend verticalAlign="top" height={36}/>
                <Scatter name="Low Risk" data={lowRiskData} fill="hsl(var(--chart-1))" shape="circle" />
                <Scatter name="Medium Risk" data={mediumRiskData} fill="hsl(var(--chart-2))" shape="circle" />
                <Scatter name="High Risk" data={highRiskData} fill="hsl(var(--destructive))" shape="circle" />
            </ScatterChart>
        </ResponsiveContainer>
    </ChartContainer>
  );
}
