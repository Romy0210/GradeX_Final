import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  trendValue?: string;
  trendDirection?: "up" | "down";
  progress?: number;
  className?: string;
};

export default function StatCard({
  title,
  value,
  icon,
  description,
  trendValue,
  trendDirection,
  progress,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden bg-card border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group", className)}>
      <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && (
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-[-4px]">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {description && (
            <p>{description}</p>
          )}
          {trendValue && (
            <div className={`flex items-center gap-1 ${trendDirection === 'down' ? 'text-red-500' : 'text-green-500'}`}>
              {trendDirection === 'down' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
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
