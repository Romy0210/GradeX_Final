'use client';

import { useState } from 'react';
import { useCorrectionRequests, type CorrectionRequest } from "@/context/correction-request-provider";
import { useStudentData } from "@/context/student-data-provider";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare,
  User,
  Calendar,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function CorrectionRequestsPage() {
  const { requests, updateRequestStatus, isLoading } = useCorrectionRequests();
  const { findStudentById } = useStudentData();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<CorrectionRequest | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStatusUpdate = async (requestId: string, status: 'resolved' | 'dismissed') => {
    setIsProcessing(true);
    try {
      await updateRequestStatus(requestId, status, adminComment);
      toast({
        title: status === 'resolved' ? "Request Resolved" : "Request Dismissed",
        description: `The request has been marked as ${status}.`,
      });
      setSelectedRequest(null);
      setAdminComment('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Failed to update the request status.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading requests...</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Correction Requests</h1>
          <p className="text-muted-foreground">
            Manage student-reported academic data inaccuracies.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            Requests awaiting your review and action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              No pending requests.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{request.studentName}</span>
                        <span className="text-xs text-muted-foreground">{request.studentId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 uppercase text-[10px] tracking-wider italic">
                        {request.field}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="line-through text-muted-foreground/60">{request.oldValue}</span>
                        <span className="text-green-600 font-medium">→ {request.newValue}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(request.createdAt?.toDate()).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <CardDescription>
            Past resolved or dismissed requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resolved On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{request.studentName}</span>
                      <span className="text-xs text-muted-foreground">{request.studentId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted text-muted-foreground font-bold px-3 py-1 uppercase text-[10px] tracking-wider italic">
                      {request.field}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={request.status === 'resolved' ? 'default' : 'secondary'}>
                      {request.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {request.updatedAt ? new Date(request.updatedAt.toDate()).toLocaleDateString() : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={selectedRequest !== null} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Correction Request</DialogTitle>
            <DialogDescription>
              Detailed information about the student's request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                    <User className="w-3 h-3" /> Student
                  </span>
                  <p className="text-sm font-medium">{selectedRequest.studentName} ({selectedRequest.studentId})</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                    <Calendar className="w-3 h-3" /> Submitted
                  </span>
                  <p className="text-sm font-medium">{new Date(selectedRequest.createdAt?.toDate()).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Info className="w-3 h-3" /> Request Details - {selectedRequest.field}
                </span>
                <p className="text-sm italic text-foreground/80">"{selectedRequest.description}"</p>
                <div className="flex gap-8 mt-2 pt-2 border-t border-muted">
                    <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Current</span>
                        <p className="text-sm font-semibold line-through opacity-50">{selectedRequest.oldValue}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Suggested</span>
                        <p className="text-sm font-bold text-green-600">→ {selectedRequest.newValue}</p>
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Admin Response / Comment
                </span>
                <Textarea 
                  placeholder="Explain your decision or provide instructions to the student..." 
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="outline" 
                  className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20"
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'dismissed')}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Dismiss Request
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'resolved')}
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolve & Notify
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
