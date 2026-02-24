'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BrainCircuit, UserPlus, Settings, Upload, FileText, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useActivityLog, type ActivityEventType } from "@/context/activity-log-provider";
import { formatDistanceToNow } from 'date-fns';

const eventTypeIcons: Record<ActivityEventType, React.ReactNode> = {
    BULK_UPLOAD: <Upload className="h-5 w-5" />,
    AI_ANALYSIS: <BrainCircuit className="h-5 w-5" />,
    STUDENT_ADD: <UserPlus className="h-5 w-5" />,
    STUDENT_UPDATE: <Edit className="h-5 w-5" />,
    STUDENT_DELETE: <Trash2 className="h-5 w-5" />,
    EXPORT: <FileText className="h-5 w-5" />,
    SETTINGS_UPDATE: <Settings className="h-5 w-5" />,
};

const eventTypeLabels: Record<ActivityEventType, string> = {
    BULK_UPLOAD: "Data Import",
    AI_ANALYSIS: "AI Analysis",
    STUDENT_ADD: "Student Add",
    STUDENT_UPDATE: "Student Edit",
    STUDENT_DELETE: "Student Delete",
    EXPORT: "Export",
    SETTINGS_UPDATE: "System Setting",
};


export default function RecentActivity() {
    const { activities } = useActivityLog();

    const formatTimestamp = (isoString: string) => {
        try {
            return formatDistanceToNow(new Date(isoString), { addSuffix: true });
        } catch (e) {
            return 'a while ago';
        }
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Activity Timeline</CardTitle>
        <CardDescription>A log of recent administrative actions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length > 0 ? (
            activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        {eventTypeIcons[activity.eventType] || <Settings className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{activity.performedBy}</span>
                        <span>•</span>
                        <span>{formatTimestamp(activity.createdAt)}</span>
                    </div>
                    </div>
                    <Badge variant="outline">{eventTypeLabels[activity.eventType]}</Badge>
                </div>
            ))
        ) : (
             <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground text-center py-4">No recent system activity.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
