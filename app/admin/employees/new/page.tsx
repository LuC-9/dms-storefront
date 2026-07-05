import { EmployeeForm } from "@/components/admin/employee-form";

export default function AdminNewEmployeePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create Employee</h1>
      <EmployeeForm />
    </div>
  );
}
