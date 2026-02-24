import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  trendValue?: string;
  trendDirection?: "up" | "down";
  progress?: number;
};

export default function StatCard({
  title,
  value,
  icon,
  description,
  trendValue,
  trendDirection,
  progress,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden bg-card">
       <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-br from-primary/10 to-background opacity-50"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {description && (
            <p>{description}</p>
          )}
          {trendValue && (
            <div className={`flex items-center gap-1 ${trendDirection === 'down' ? 'text-red-500' : 'text-green-500'}`}>
                {trendDirection === 'down' ? <ArrowDown className="h-3 w-3"/> : <ArrowUp className="h-3 w-3"/>}
                <span>{trendValue}</span>
            </div>
          )}
        </div>
        {progress !== undefined && (
            <Progress value={progress} className="mt-2 h-2" />
        )}
      </CardContent>
    </Card>
  );
}
