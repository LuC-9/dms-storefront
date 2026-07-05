import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EmployeeForm } from "@/components/admin/employee-form";
import { SalaryDialog } from "@/components/admin/salary-dialog";
import { AttendanceDialog } from "@/components/admin/attendance-dialog";
import { formatInr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function AdminEmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      salaries: { orderBy: { paidAt: "desc" } },
      attendance: { orderBy: { date: "desc" } },
    },
  });

  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{employee.name}</h1>
      <EmployeeForm
        initial={{
          ...employee,
          joinDate: employee.joinDate.toISOString().slice(0, 10),
        }}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <SalaryDialog employeeId={employee.id} />
        <AttendanceDialog employeeId={employee.id} />
      </div>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Salary History</h2>
        <div className="space-y-2">
          {employee.salaries.map((salary) => (
            <div key={salary.id} className="rounded-md border border-steel-200 p-3 text-sm">
              <p className="font-medium">{salary.month}</p>
              <p>Net Paid: {formatInr(salary.netPaid)}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">Recent Attendance</h2>
        <div className="flex flex-wrap gap-2">
          {employee.attendance.map((attendance) => (
            <Badge key={attendance.id}>
              {attendance.date.toISOString().slice(0, 10)} - {attendance.status}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
