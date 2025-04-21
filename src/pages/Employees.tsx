
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { PlusIcon } from 'lucide-react';
import { Edit, Trash2 } from "lucide-react";
import { EmployeeDialog } from "@/components/EmployeeDialog";

// Initial employee data for demonstration
const initialEmployees = [
  {
    id: "1",
    empId: "EMP001",
    name: "John Smith",
    position: "Sales Manager",
    department: "Sales",
    hireDate: "2020-05-12"
  },
  {
    id: "2",
    empId: "EMP002",
    name: "Sarah Johnson",
    position: "Sales Representative",
    department: "Sales",
    hireDate: "2021-02-18"
  },
  {
    id: "3",
    empId: "EMP003",
    name: "Michael Brown",
    position: "Sales Representative",
    department: "Marketing",
    hireDate: "2019-11-03"
  },
  {
    id: "4",
    empId: "EMP004",
    name: "Emily Davis",
    position: "Sales Assistant",
    department: "Customer Support",
    hireDate: "2022-01-10"
  },
  {
    id: "5",
    empId: "EMP005",
    name: "David Wilson",
    position: "Regional Sales Manager",
    department: "Executive",
    hireDate: "2018-07-22"
  }
];

const Employees: React.FC = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState(initialEmployees);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  // Function to sort employees by empId as TR0001...TR9xxx (ascending)
  const sortedEmployees = [...employees].sort((a, b) =>
    a.empId.localeCompare(b.empId, undefined, { numeric: true, sensitivity: "base" })
  );

  // Add
  const handleAdd = (data: any) => {
    setEmployees(prev => [...prev, { ...data, id: String(Date.now()) }]);
    setIsAddDialogOpen(false);
    toast({
      title: "Employee added",
      description: `${data.name} has been added to the system.`,
    });
  };

  // Edit
  const handleEditClick = (employee: any) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };
  const handleEdit = (data: any) => {
    setEmployees(prev => prev.map(e => (e.id === selectedEmployee.id ? { ...e, ...data } : e)));
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
    toast({
      title: "Employee updated",
      description: `${data.name}'s information has been updated.`,
    });
  };

  // Delete
  const handleDelete = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    toast({
      title: "Employee deleted",
      description: `Employee has been removed from the system.`,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Manage and view all employees in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[450px] border rounded-lg">
            <Table>
              {/* Fixed header with sticky CSS */}
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="bg-background sticky top-0 z-20">Employee ID</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Employee</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Position</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Department</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Hire Date</TableHead>
                  <TableHead className="text-right bg-background sticky top-0 z-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.empId}</TableCell>
                    <TableCell className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{employee.name}</div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{new Date(employee.hireDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(employee)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <EmployeeDialog
        open={isAddDialogOpen}
        mode="add"
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAdd}
      />
      {/* Edit Employee Dialog */}
      <EmployeeDialog
        open={isEditDialogOpen}
        mode="edit"
        employee={selectedEmployee}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedEmployee(null);
        }}
        onSave={handleEdit}
      />
    </div>
  );
};

export default Employees;
