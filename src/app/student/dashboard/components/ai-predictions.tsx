import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Student } from "@/lib/data";
import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";

type AIPredictionsProps = {
  student: Student;
};

const getRiskBadgeVariant = (
  riskLevel: "Low" | "Medium" | "High"
): "default" | "secondary" | "destructive" => {
  switch (riskLevel) {
    case "Low":
      return "default";
    case "Medium":
      return "secondary";
    case "High":
      return "destructive";
  }
};

const PredictionItem = ({ icon, label, value, valueBadgeVariant, valueClassName }: { icon: React.ReactNode, label: string, value: string, valueBadgeVariant?: "default" | "secondary" | "destructive", valueClassName?: string }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            {icon}
            <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        {valueBadgeVariant ? (
            <Badge variant={valueBadgeVariant}>{value}</Badge>
        ) : (
            <span className={`font-semibold ${valueClassName}`}>{value}</span>
        )}
    </div>
);


export function AIPredictions({ student }: AIPredictionsProps) {
  const probabilityLabel =
    student.outcome === "Pass"
      ? "Prediction Confidence"
      : "Failure Risk Probability";
  const probabilityValue =
    student.outcome === "Pass"
      ? student.predictionConfidence
      : student.failureRiskProbability;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Prediction Panel</CardTitle>
        <CardDescription>Analysis of your performance data.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <PredictionItem 
            icon={<Shield className="w-4 h-4 text-muted-foreground" />} 
            label="Risk Level" 
            value={student.riskLevel}
            valueBadgeVariant={getRiskBadgeVariant(student.riskLevel)}
        />
        <PredictionItem 
            icon={student.outcome === 'Pass' ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : <AlertTriangle className="w-4 h-4 text-red-500"/>} 
            label="Predicted Outcome" 
            value={student.outcome}
            valueClassName={student.outcome === 'Pass' ? 'text-green-500' : 'text-red-500'}
        />
        <PredictionItem 
            icon={<div className="font-bold text-lg text-muted-foreground w-4 h-4 flex items-center justify-center">G</div>}
            label="Predicted Grade" 
            value={student.gradeCategory}
        />
        {probabilityValue && (
            <PredictionItem 
                icon={<div className="font-bold text-lg text-muted-foreground w-4 h-4 flex items-center justify-center">%</div>} 
                label={probabilityLabel} 
                value={`${probabilityValue}%`}
            />
        )}
      </CardContent>
    </Card>
  );
}
