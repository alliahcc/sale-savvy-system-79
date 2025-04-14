
import React from 'react';
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
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <Button>Add Employee</Button>
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
    </div>
  );
};

export default Employees;
