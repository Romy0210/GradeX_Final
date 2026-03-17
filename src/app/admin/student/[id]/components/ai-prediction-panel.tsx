
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Student, StudentSubjectAnalysis } from "@/lib/data";
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import type { GenerateStudentReportOutput } from "@/ai/flows/generate-student-report";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const getRiskBadgeVariant = (
  riskLevel?: "Low" | "Medium" | "High"
): "default" | "secondary" | "destructive" => {
  switch (riskLevel) {
    case "Low":
      return "default";
    case "Medium":
      return "secondary";
    case "High":
      return "destructive";
    default:
      return "secondary";
  }
};

const PredictionItem = ({
  icon,
  label,
  value,
  valueBadgeVariant,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueBadgeVariant?: "default" | "secondary" | "destructive";
  valueClassName?: string;
}) => (
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

type PredictionData = Partial<Student> & Partial<GenerateStudentReportOutput>;

const OverallPrediction = ({
  predictionData,
}: {
  predictionData: PredictionData;
}) => {
  const probability =
    predictionData?.outcome === "Pass"
      ? predictionData?.predictionConfidence
      : predictionData?.failureRiskProbability;
  const probabilityLabel =
    predictionData?.outcome === "Pass"
      ? "Prediction Confidence"
      : "Failure Risk Probability";

  return (
    <div className="grid gap-4">
      <PredictionItem
        icon={<Shield className="w-4 h-4 text-muted-foreground" />}
        label="Overall Risk Level"
        value={predictionData.riskLevel!}
        valueBadgeVariant={getRiskBadgeVariant(predictionData.riskLevel)}
      />
      <PredictionItem
        icon={
          predictionData.outcome === "Pass" ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )
        }
        label="Overall Predicted Outcome"
        value={predictionData.outcome!}
        valueClassName={
          predictionData.outcome === "Pass"
            ? "text-green-500"
            : "text-red-500"
        }
      />
      <PredictionItem
        icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
        label="Overall Predicted Grade"
        value={predictionData.gradeCategory!}
      />
      {probability != null && (
        <PredictionItem
          icon={
            <div className="font-bold text-lg text-muted-foreground w-4 h-4 flex items-center justify-center">
              %
            </div>
          }
          label={probabilityLabel}
          value={`${probability.toFixed(0)}%`}
        />
      )}
    </div>
  );
};

const SubjectPrediction = ({ subjectAnalysis }: { subjectAnalysis: StudentSubjectAnalysis }) => {
    return (
        <div className="grid gap-3 pl-4">
            <PredictionItem
                icon={<Shield className="w-4 h-4 text-muted-foreground" />}
                label="Risk Level"
                value={subjectAnalysis.riskLevel}
                valueBadgeVariant={getRiskBadgeVariant(subjectAnalysis.riskLevel)}
            />
             <PredictionItem
                icon={
                    subjectAnalysis.outcome === "Pass" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    )
                }
                label="Predicted Outcome"
                value={subjectAnalysis.outcome}
                 valueClassName={
                    subjectAnalysis.outcome === "Pass"
                        ? "text-green-500"
                        : "text-red-500"
                }
            />
            <PredictionItem
                icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
                label="Predicted Grade"
                value={subjectAnalysis.gradeCategory}
            />
        </div>
    )
};


export function AIPredictionPanel({
  predictionData,
  isLoading,
}: {
  predictionData: PredictionData;
  isLoading: boolean;
}) {
  const hasOverallPrediction = predictionData.riskLevel;
  const hasSubjectAnalyses = predictionData.subjectAnalyses && predictionData.subjectAnalyses.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Prediction Panel</CardTitle>
        <CardDescription>
          Analysis based on the latest student data, including overall and subject-specific insights.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Separator />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !hasOverallPrediction ? (
           <p className="text-muted-foreground text-center py-4">
            No prediction data available. Run analysis to generate predictions.
          </p>
        ) : (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold mb-3">Overall Academic Prediction</h3>
                    <OverallPrediction predictionData={predictionData} />
                </div>
                
                {hasSubjectAnalyses && (
                    <div>
                        <Separator className="mb-4" />
                        <h3 className="text-lg font-semibold mb-3">Subject-wise Prediction Analysis</h3>
                        <Accordion type="single" collapsible className="w-full">
                            {predictionData.subjectAnalyses?.map((subject, index) => (
                                <AccordionItem value={`item-${index}`} key={subject.subjectId}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            <span>{subject.subjectName}</span>
                                            <Badge variant={getRiskBadgeVariant(subject.riskLevel)} className="ml-2">{subject.riskLevel} Risk</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <SubjectPrediction subjectAnalysis={subject} />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
