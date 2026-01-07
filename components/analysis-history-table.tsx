"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Download } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getCountryLabel } from "@/lib/countries"

type AnalysisStatus = "pending" | "running" | "completed" | "failed"

interface Analysis {
  id: string
  country: string
  indicator: string
  startDate: string
  endDate: string
  status: AnalysisStatus
  createdAt: Date
  completedAt?: Date
}

const statusColors: Record<AnalysisStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  running: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
}

interface AnalysisHistoryTableProps {
  analyses: Analysis[]
  onViewDetails: (id: string) => void
  onDownload: (id: string) => void
}

export function AnalysisHistoryTable({ analyses, onViewDetails, onDownload }: AnalysisHistoryTableProps) {
  return (
    <div className="rounded-xl border bg-card p-2 sm:p-4">
      <Table className="text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead>Country</TableHead>
            <TableHead>Indicator</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analyses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No analyses found. Run your first analysis to get started.
              </TableCell>
            </TableRow>
          ) : (
            analyses.map((analysis) => (
              <TableRow key={analysis.id}>
                <TableCell className="font-medium">{getCountryLabel(analysis.country) || analysis.country}</TableCell>
                <TableCell>{analysis.indicator}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {analysis.startDate} → {analysis.endDate}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[analysis.status]}>
                    {analysis.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewDetails(analysis.id)}
                      disabled={analysis.status !== "completed"}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownload(analysis.id)}
                      disabled={analysis.status !== "completed"}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
