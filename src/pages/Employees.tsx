
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

// Sample employee data
const employeesData = [
  {
    id: 1,
    name: 'John Davis',
    email: 'john.davis@salesavvy.com',
    position: 'Senior Sales Representative',
    department: 'Direct Sales',
    status: 'active',
    joinDate: '2021-03-15',
    salesLastMonth: 42450,
  },
  {
    id: 2,
    name: 'Emily Wilson',
    email: 'emily.wilson@salesavvy.com',
    position: 'Sales Manager',
    department: 'Channel Sales',
    status: 'active',
    joinDate: '2020-06-22',
    salesLastMonth: 56780,
  },
  {
    id: 3,
    name: 'Michael Scott',
    email: 'michael.scott@salesavvy.com',
    position: 'Regional Sales Director',
    department: 'Enterprise Sales',
    status: 'active',
    joinDate: '2019-01-10',
    salesLastMonth: 103450,
  },
  {
    id: 4,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@salesavvy.com',
    position: 'Sales Representative',
    department: 'Direct Sales',
    status: 'active',
    joinDate: '2022-02-28',
    salesLastMonth: 28900,
  },
  {
    id: 5,
    name: 'David Miller',
    email: 'david.miller@salesavvy.com',
    position: 'Account Executive',
    department: 'Enterprise Sales',
    status: 'on leave',
    joinDate: '2021-07-05',
    salesLastMonth: 0,
  },
  {
    id: 6,
    name: 'Jessica Taylor',
    email: 'jessica.taylor@salesavvy.com',
    position: 'Sales Representative',
    department: 'Channel Sales',
    status: 'active',
    joinDate: '2022-05-18',
    salesLastMonth: 34560,
  },
  {
    id: 7,
    name: 'Robert Brown',
    email: 'robert.brown@salesavvy.com',
    position: 'Senior Account Executive',
    department: 'Enterprise Sales',
    status: 'inactive',
    joinDate: '2020-11-11',
    salesLastMonth: 0,
  },
  {
    id: 8,
    name: 'Lisa Anderson',
    email: 'lisa.anderson@salesavvy.com',
    position: 'Sales Representative',
    department: 'Direct Sales',
    status: 'active',
    joinDate: '2022-08-30',
    salesLastMonth: 19870,
  },
];

const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    active: { variant: 'default', className: 'bg-green-500' },
    'on leave': { variant: 'secondary' },
    inactive: { variant: 'outline', className: 'text-muted-foreground' },
  } as const;

  const variant = variants[status as keyof typeof variants] || variants.active;
  
  return (
    <Badge
      variant={variant.variant as "default" | "secondary" | "destructive" | "outline"}
      className={variant.className}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const Employees: React.FC = () => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter employees based on search
  const filteredEmployees = employeesData.filter((employee) =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <Button className="gap-1">
          <Plus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
          <CardDescription>Manage and view all employees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  {!isMobile && <TableHead>Position</TableHead>}
                  {!isMobile && <TableHead>Department</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Sales
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback>
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{employee.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      {!isMobile && <TableCell>{employee.position}</TableCell>}
                      {!isMobile && <TableCell>{employee.department}</TableCell>}
                      <TableCell>
                        <StatusBadge status={employee.status} />
                      </TableCell>
                      <TableCell>${employee.salesLastMonth.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>View Sales</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Employees;
