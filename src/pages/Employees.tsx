
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { PlusIcon } from 'lucide-react';

const employees = [
  {
    id: "1",
    name: "John Smith",
    position: "Sales Manager",
    department: "Sales",
    email: "john.smith@example.com",
    performance: "High",
    hireDate: "2020-05-12",
    status: "Active"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    position: "Sales Representative",
    department: "Sales",
    email: "sarah.johnson@example.com",
    performance: "Medium",
    hireDate: "2021-02-18",
    status: "Active"
  },
  {
    id: "3",
    name: "Michael Brown",
    position: "Sales Representative",
    department: "Sales",
    email: "michael.brown@example.com",
    performance: "High",
    hireDate: "2019-11-03",
    status: "Active"
  },
  {
    id: "4",
    name: "Emily Davis",
    position: "Sales Assistant",
    department: "Sales",
    email: "emily.davis@example.com",
    performance: "Medium",
    hireDate: "2022-01-10",
    status: "On Leave"
  },
  {
    id: "5",
    name: "David Wilson",
    position: "Regional Sales Manager",
    department: "Sales",
    email: "david.wilson@example.com",
    performance: "High",
    hireDate: "2018-07-22",
    status: "Active"
  }
];

const getPerformanceBadge = (performance: string) => {
  if (performance === "High") {
    return <Badge className="bg-green-500">High</Badge>;
  } else if (performance === "Medium") {
    return <Badge variant="secondary">Medium</Badge>;
  } else {
    return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
  }
};

const getStatusBadge = (status: string) => {
  if (status === "Active") {
    return <Badge className="bg-green-500">Active</Badge>;
  } else if (status === "On Leave") {
    return <Badge variant="secondary">On Leave</Badge>;
  } else {
    return <Badge variant="destructive">Inactive</Badge>;
  }
};

const Employees: React.FC = () => {
  const { toast } = useToast();
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    position: "",
    performance: "Medium",
    status: "Active",
    hireDate: new Date().toISOString().split('T')[0]
  });
  
  const handleAddEmployeeOpen = () => {
    setIsAddEmployeeDialogOpen(true);
  };
  
  const handleAddEmployeeClose = () => {
    setIsAddEmployeeDialogOpen(false);
    setNewEmployee({
      name: "",
      email: "",
      position: "",
      performance: "Medium",
      status: "Active",
      hireDate: new Date().toISOString().split('T')[0]
    });
  };
  
  const handleAddEmployeeSubmit = () => {
    // In a real app, you would save this to your database
    toast({
      title: "Employee added",
      description: `${newEmployee.name} has been added to the system.`,
    });
    handleAddEmployeeClose();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <Button onClick={handleAddEmployeeOpen}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Manage and view all employees in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">{employee.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>{getPerformanceBadge(employee.performance)}</TableCell>
                  <TableCell>{getStatusBadge(employee.status)}</TableCell>
                  <TableCell>{new Date(employee.hireDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the details for the new employee.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name
              </Label>
              <Input
                id="name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="position" className="text-right">
                Position
              </Label>
              <Select 
                onValueChange={(value) => setNewEmployee({...newEmployee, position: value})}
                value={newEmployee.position}
              >
                <SelectTrigger id="position" className="col-span-3">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                  <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                  <SelectItem value="Sales Assistant">Sales Assistant</SelectItem>
                  <SelectItem value="Regional Sales Manager">Regional Sales Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="performance" className="text-right">
                Performance
              </Label>
              <Select 
                onValueChange={(value) => setNewEmployee({...newEmployee, performance: value})}
                value={newEmployee.performance}
              >
                <SelectTrigger id="performance" className="col-span-3">
                  <SelectValue placeholder="Select performance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select 
                onValueChange={(value) => setNewEmployee({...newEmployee, status: value})}
                value={newEmployee.status}
              >
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hireDate" className="text-right">
                Hire Date
              </Label>
              <Input
                id="hireDate"
                type="date"
                value={newEmployee.hireDate}
                onChange={(e) => setNewEmployee({...newEmployee, hireDate: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleAddEmployeeClose}>Cancel</Button>
            <Button onClick={handleAddEmployeeSubmit}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
