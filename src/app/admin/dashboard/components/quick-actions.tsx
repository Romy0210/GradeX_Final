'use client';

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileDown, Upload, BookMarked } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStudentData } from "@/context/student-data-provider";
import { useUser } from "@/firebase/auth/use-user";
import { exportHighRiskReport } from "@/lib/export";
import { useActivityLog } from "@/context/activity-log-provider";

const actionTiles = [
  { href: "/admin/students", icon: PlusCircle, label: "Add Student" },
  { href: "/admin/students/bulk-upload", icon: Upload, label: "Bulk Upload" },
  { href: "/admin/subjects", icon: BookMarked, label: "Configure Subjects" },
  { href: "#", icon: FileDown, label: "Export Risk Report", isAction: true, actionType: 'export' },
]

export default function QuickActions() {
  const { toast } = useToast();
  const { students } = useStudentData();
  const { user } = useUser();
  const { logActivity } = useActivityLog();

  const handleActionClick = (type: string) => {
    if (type === 'export') {
      const isHighRisk = (s: typeof students[0]) => s.riskLevel === "High" || (s.subjectAnalyses?.some(sub => sub.riskLevel === "High") ?? false);
      const highRiskStudents = students.filter(isHighRisk);
      if (highRiskStudents.length === 0) {
        toast({
          title: "No High-Risk Students",
          description: "There are no students in the high-risk category to export.",
        });
        return;
      }
      const fileName = `GradeX_High_Risk_Students_${new Date().toISOString().split('T')[0]}.csv`;

      exportHighRiskReport(students, { generatedBy: user?.email }, fileName);

      logActivity("EXPORT", `Exported ${highRiskStudents.length} high-risk students to CSV from dashboard.`);

      toast({
        title: "Export Complete",
        description: `${highRiskStudents.length} high-risk students have been exported to ${fileName}.`,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Shortcuts to common tasks.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {actionTiles.map(tile => (
          tile.isAction ? (
            <Button key={tile.label} variant="outline" className="flex flex-col h-20 gap-1" onClick={() => handleActionClick(tile.actionType!)}>
              <tile.icon className="h-5 w-5" />
              <span className="text-xs text-center">{tile.label}</span>
            </Button>
          ) : (
            <Button key={tile.label} variant="outline" className="flex flex-col h-20 gap-1" asChild>
              <Link href={tile.href}>
                <tile.icon className="h-5 w-5" />
                <span className="text-xs text-center">{tile.label}</span>
              </Link>
            </Button>
          )
        ))}
      </CardContent>
    </Card>
  );
}
