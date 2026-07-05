import { formatInr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type RefundRecord = {
  id: string;
  amountInPaise: number;
  type: "FULL" | "PARTIAL";
  status: "PENDING" | "PROCESSED" | "FAILED";
  initiatedBy: string;
  reason: string;
  createdAt: string;
};

function statusClass(status: RefundRecord["status"]) {
  if (status === "PROCESSED") return "bg-green-100 text-green-700";
  if (status === "FAILED") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

export function RefundHistoryPanel({ refunds }: { refunds: RefundRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Refund history</CardTitle>
      </CardHeader>
      <CardContent>
        {refunds.length === 0 ? (
          <p className="text-sm text-steel-500">No refunds recorded for this order.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Initiated by</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell>{new Date(refund.createdAt).toLocaleString("en-IN")}</TableCell>
                  <TableCell>{formatInr(refund.amountInPaise)}</TableCell>
                  <TableCell>{refund.type === "FULL" ? "Full" : "Partial"}</TableCell>
                  <TableCell>
                    <Badge className={statusClass(refund.status)}>{refund.status}</Badge>
                  </TableCell>
                  <TableCell>{refund.initiatedBy}</TableCell>
                  <TableCell className="max-w-[280px] whitespace-pre-wrap">{refund.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
