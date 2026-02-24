
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "next-themes";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useStudentData } from "@/context/student-data-provider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings, FileDown, Zap, Clock, Info, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/context/settings-provider";
import { useUser } from "@/firebase/auth/use-user";
import { exportAllStudentsReport, exportHighRiskReport } from "@/lib/export";
import { useActivityLog } from "@/context/activity-log-provider";
import RecentActivity from "../dashboard/components/recent-activity";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const modelSettingsSchema = z.object({
  highRiskThreshold: z.coerce.number().min(0).max(10),
  lowRiskThreshold: z.coerce.number().min(0).max(10),
});

const notificationSettingsSchema = z.object({
  highRiskAlerts: z.boolean().default(true),
  mediumRiskAlerts: z.boolean().default(false),
  alertFrequency: z.enum(["immediate", "daily"]),
});


type ModelSettingsFormValues = z.infer<typeof modelSettingsSchema>;
type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { students, clearStudentData } = useStudentData();
  const { user } = useUser();
  const { setTheme, theme } = useTheme();
  const { modelParameters, setModelParameters } = useSettings();
  const { logActivity } = useActivityLog();

  const modelForm = useForm<ModelSettingsFormValues>({
    resolver: zodResolver(modelSettingsSchema),
    defaultValues: modelParameters,
  });

  useEffect(() => {
    modelForm.reset(modelParameters);
  }, [modelParameters, modelForm]);

  const notificationForm = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      highRiskAlerts: true,
      mediumRiskAlerts: false,
      alertFrequency: "daily",
    },
  });
  
  const watchedAlertFrequency = notificationForm.watch("alertFrequency");
  
  function onModelSubmit(data: ModelSettingsFormValues) {
    setModelParameters(data);
    logActivity("SETTINGS_UPDATE", `Model risk thresholds updated. High risk: ${data.highRiskThreshold}, Low risk: ${data.lowRiskThreshold}.`);
    toast({
      title: "Model Parameters Saved",
      description: "The risk prediction thresholds have been updated. Re-run analysis on students to see changes.",
    });
  }

  function onNotificationSubmit(data: NotificationSettingsFormValues) {
    logActivity("SETTINGS_UPDATE", "Notification settings updated.");
    toast({
      title: "Notification Settings Saved",
      description: "Your notification preferences have been updated.",
    });
  }

  const handleExportAll = () => {
    if (students.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no students to export.",
      });
      return;
    }
  
    const fileName = `GradeX_All_Students_${new Date().toISOString().split('T')[0]}.csv`;
    exportAllStudentsReport(students, { generatedBy: user?.email }, fileName);
    logActivity("EXPORT", `Exported all ${students.length} students to CSV.`);
    toast({
      title: "Export Complete",
      description: `All student data has been exported to ${fileName}.`,
    });
  };

  const handleExportHighRisk = () => {
    const highRiskStudents = students.filter((s) => s.riskLevel === "High");
    if (highRiskStudents.length === 0) {
      toast({
        title: "No High-Risk Students",
        description: "There are no students in the high-risk category to export.",
      });
      return;
    }
    const fileName = `GradeX_High_Risk_Students_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    exportHighRiskReport(students, { generatedBy: user?.email }, fileName);
    logActivity("EXPORT", `Exported ${highRiskStudents.length} high-risk students to CSV.`);
    toast({
      title: "Export Complete",
      description: `${highRiskStudents.length} high-risk students have been exported to ${fileName}.`,
    });
  };

  const handleClearCache = () => {
    logActivity("SETTINGS_UPDATE", "Local application cache was cleared.");
    clearStudentData();
    toast({
      title: "Local Cache Cleared",
      description: "All student data has been reset to the initial demo data.",
    });
  };

  return (
    <>
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings, notifications, and data management.
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
        <Form {...modelForm}>
          <form onSubmit={modelForm.handleSubmit(onModelSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Model Parameters</CardTitle>
                <CardDescription>
                  Adjust the thresholds for the student risk prediction model.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={modelForm.control}
                    name="highRiskThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>High-Risk Threshold (GPA)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormDescription>
                          GPA below this value will be considered high-risk.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={modelForm.control}
                    name="lowRiskThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low-Risk Threshold (GPA)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormDescription>
                          GPA above this value is considered low-risk. GPAs in between are medium-risk.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Save Model Parameters</Button>
              </CardFooter>
            </Card>
          </form>
        </Form>

        <Form {...notificationForm}>
          <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Manage automated dashboard alerts for at-risk students.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                 <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="highRiskAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              High-Risk Alerts
                            </FormLabel>
                            <FormDescription>
                              Receive a dashboard toast when a student is flagged as high-risk.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="mediumRiskAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Medium-Risk Alerts
                            </FormLabel>
                            <FormDescription>
                               Receive a dashboard toast for medium-risk students.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                 </div>

                 <Separator />
                
                <TooltipProvider>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Label className="text-base font-semibold">Alert Delivery Mode</Label>
                             <Tooltip>
                                <TooltipTrigger asChild><button type="button"><Info className="w-4 h-4 text-muted-foreground" /></button></TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        <b>Real-Time:</b> Instant triggers.
                                        <br />
                                        <b>Daily Digest:</b> Aggregated once per day.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-sm text-muted-foreground -mt-2">
                           Choose how risk alerts are delivered to the dashboard.
                        </p>
                        
                        <FormField
                            control={notificationForm.control}
                            name="alertFrequency"
                            render={({ field }) => (
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                >
                                    <FormItem>
                                        <Label htmlFor="freq-immediate" className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:shadow-lg block cursor-pointer">
                                            <RadioGroupItem value="immediate" id="freq-immediate" className="sr-only" />
                                            <div className="p-4 rounded-lg border-2 border-muted bg-popover transition-all duration-200 hover:border-primary/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <Zap className="w-6 h-6 text-primary"/>
                                                        <h3 className="font-semibold">Real-Time Alerts</h3>
                                                    </div>
                                                    <Badge variant="secondary">Recommended</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Instant dashboard alerts when a student becomes high or medium risk.</p>
                                            </div>
                                        </Label>
                                    </FormItem>
                                    <FormItem>
                                        <Label htmlFor="freq-daily" className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:shadow-lg block cursor-pointer">
                                            <RadioGroupItem value="daily" id="freq-daily" className="sr-only" />
                                            <div className="p-4 rounded-lg border-2 border-muted bg-popover transition-all duration-200 hover:border-primary/50">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Clock className="w-6 h-6 text-primary"/>
                                                    <h3 className="font-semibold">Daily Summary</h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Receive one consolidated dashboard notification per day, including all new high and medium-risk students.</p>
                                            </div>
                                        </Label>
                                    </FormItem>
                                </RadioGroup>
                            )}
                        />
                        
                        <div className="space-y-2 pt-2">
                            <Label>Live Behavior Preview</Label>
                            <div className="p-4 border rounded-lg bg-muted/50 text-sm">
                                {watchedAlertFrequency === 'immediate' ? (
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-destructive" />
                                        <div>
                                            <p className="font-semibold">Maria Garcia flagged as High Risk</p>
                                            <p className="text-xs text-muted-foreground">Displayed immediately at 10:32 AM</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-semibold">Daily Risk Summary – 3 High Risk, 2 Medium Risk</p>
                                            <p className="text-xs text-muted-foreground">Delivered at 8:00 PM</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                 </TooltipProvider>
              </CardContent>
              <CardFooter>
                <Button type="submit">Save Notification Settings</Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
        
        <div className="grid md:grid-cols-2 gap-6">
           <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Export reports or manage local application data.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Standard Exports</Label>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleExportAll}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export All Students (CSV)
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleExportHighRisk}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export High-Risk Students (CSV)
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    For context-aware exports (e.g., by batch or class), use the
                    Analytics page.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Cache Management</Label>
                  <CardDescription>
                    Clearing the cache will remove all stored student data from
                    your browser and reset to initial demo data.
                  </CardDescription>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleClearCache}
                  >
                    Clear Local Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
            <RecentActivity />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Choose how GradeX looks. The default will be based on your system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
                 <Label>Theme</Label>
                <RadioGroup
                  value={theme}
                  onValueChange={(newTheme) => setTheme(newTheme as "light" | "dark" | "system")}
                  className="grid max-w-md grid-cols-3 gap-8 pt-2"
                >
                  <FormItem>
                    <Label className="[&:has([data-state=checked])>div]:border-primary">
                      <RadioGroupItem value="light" className="sr-only" />
                      <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                        <div className="space-y-2 rounded-sm bg-[#ecedf0] p-2">
                          <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-[#ecedf0]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedf0]" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#ecedf0]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedf0]" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#ecedf0]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#ecedf0]" />
                          </div>
                        </div>
                      </div>
                      <span className="block w-full p-2 text-center font-normal">
                        Light
                      </span>
                    </Label>
                  </FormItem>
                  <FormItem>
                    <Label className="[&:has([data-state=checked])>div]:border-primary">
                      <RadioGroupItem value="dark" className="sr-only" />
                      <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent">
                        <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                          <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                        </div>
                      </div>
                      <span className="block w-full p-2 text-center font-normal">
                        Dark
                      </span>
                    </Label>
                  </FormItem>
                  <FormItem>
                    <Label className="[&:has([data-state=checked])>div]:border-primary">
                      <RadioGroupItem value="system" className="sr-only" />
                      <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                        <div className="flex h-[116px] items-center justify-center rounded-lg bg-muted-foreground/10 p-6">
                          <Settings className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                      <span className="block w-full p-2 text-center font-normal">
                        System
                      </span>
                    </Label>
                  </FormItem>
                </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
