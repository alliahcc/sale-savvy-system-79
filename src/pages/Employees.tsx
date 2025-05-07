
import React, { useState, useEffect } from 'react';
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
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  empId: string;
  name: string;
  position: string;
  department: string;
  hireDate: string;
}

const Employees: React.FC = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Fetch employees from Supabase
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setIsLoading(true);
        const { data: employeeData, error } = await supabase
          .from('employee')
          .select('*');

        if (error) {
          console.error('Error fetching employees:', error);
          toast({
            title: "Error",
            description: "Failed to load employees. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Transform the data to match our Employee interface
        const formattedEmployees = employeeData.map(emp => ({
          id: emp.empno,
          empId: emp.empno,
          name: `${emp.firstname || ''} ${emp.lastname || ''}`.trim(),
          position: "Sales Representative", // Default position if not available
          department: "Sales", // Default department if not available
          hireDate: emp.hiredate || new Date().toISOString().split("T")[0],
        }));

        setEmployees(formattedEmployees);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployees();
  }, [toast]);

  // Function to sort employees by empId
  const sortedEmployees = [...employees].sort((a, b) =>
    a.empId.localeCompare(b.empId, undefined, { numeric: true, sensitivity: "base" })
  );

  // Add
  const handleAdd = (data: any) => {
    // This would need to be updated to actually save to Supabase
    setEmployees(prev => [...prev, { ...data, id: String(data.empId) }]);
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
    // This would need to be updated to actually save to Supabase
    setEmployees(prev => prev.map(e => (e.id === selectedEmployee?.id ? { ...e, ...data } : e)));
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
    toast({
      title: "Employee updated",
      description: `${data.name}'s information has been updated.`,
    });
  };

  // Delete
  const handleDelete = (id: string) => {
    // This would need to be updated to actually delete from Supabase
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Loading employees...
                    </TableCell>
                  </TableRow>
                ) : sortedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEmployees.map((employee) => (
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
                  ))
                )}
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
