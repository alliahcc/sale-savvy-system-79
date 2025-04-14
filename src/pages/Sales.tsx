
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, ArrowUpDown, MoreHorizontal, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Sample sales data
const salesData = [
  {
    id: '1',
    customerName: 'Alice Johnson',
    product: 'Premium Plan',
    amount: 299.99,
    status: 'completed',
    date: '2023-04-12',
  },
  {
    id: '2',
    customerName: 'Bob Smith',
    product: 'Basic Plan',
    amount: 99.99,
    status: 'processing',
    date: '2023-04-10',
  },
  {
    id: '3',
    customerName: 'Charlie Brown',
    product: 'Enterprise Plan',
    amount: 599.99,
    status: 'completed',
    date: '2023-04-08',
  },
  {
    id: '4',
    customerName: 'Diana Prince',
    product: 'Premium Plan',
    amount: 299.99,
    status: 'failed',
    date: '2023-04-05',
  },
  {
    id: '5',
    customerName: 'Edward Norton',
    product: 'Basic Plan',
    amount: 99.99,
    status: 'completed',
    date: '2023-04-03',
  },
  {
    id: '6',
    customerName: 'Frank Castle',
    product: 'Enterprise Plan',
    amount: 599.99,
    status: 'processing',
    date: '2023-04-01',
  },
  {
    id: '7',
    customerName: 'Grace Kelly',
    product: 'Premium Plan',
    amount: 299.99,
    status: 'completed',
    date: '2023-03-29',
  },
  {
    id: '8',
    customerName: 'Henry Ford',
    product: 'Basic Plan',
    amount: 99.99,
    status: 'failed',
    date: '2023-03-27',
  },
];

const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    completed: { variant: 'default', className: 'bg-green-500' },
    processing: { variant: 'secondary' },
    failed: { variant: 'destructive' },
  } as const;

  const variant = variants[status as keyof typeof variants] || variants.processing;
  
  return (
    <Badge
      variant={variant.variant as "default" | "secondary" | "destructive" | "outline"}
      className={variant.className}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const Sales: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter sales based on search and status
  const filteredSales = salesData.filter((sale) => {
    const matchesSearch = sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.product.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (saleId: string) => {
    navigate(`/sales/${saleId}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
        <Button className="gap-1">
          <Plus className="h-4 w-4" /> New Sale
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Management</CardTitle>
          <CardDescription>Manage and view all sales records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
              <Label htmlFor="search" className="mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by customer or product..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-1/6">
              <Label htmlFor="status" className="mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center">
                      Customer
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Amount
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Date
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(sale.id)}>
                      <TableCell className="font-medium">{sale.customerName}</TableCell>
                      <TableCell>{sale.product}</TableCell>
                      <TableCell>${sale.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <StatusBadge status={sale.status} />
                      </TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(sale.id);
                            }}>
                              <FileText className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Delete</DropdownMenuItem>
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

export default Sales;
