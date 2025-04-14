
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from 'react-router-dom';

const sales = [
  {
    id: "1",
    transactionNumber: "INV-2023-0042",
    date: "2023-04-15",
    customer: "Acme Corporation",
    amount: 2592.00,
    status: "Completed",
    paymentStatus: "Paid"
  },
  {
    id: "2",
    transactionNumber: "INV-2023-0043",
    date: "2023-04-16",
    customer: "Globex Inc.",
    amount: 1850.50,
    status: "Completed",
    paymentStatus: "Paid"
  },
  {
    id: "3",
    transactionNumber: "INV-2023-0044",
    date: "2023-04-17",
    customer: "Stark Industries",
    amount: 4200.75,
    status: "Pending",
    paymentStatus: "Pending"
  },
  {
    id: "4",
    transactionNumber: "INV-2023-0045",
    date: "2023-04-18",
    customer: "Wayne Enterprises",
    amount: 1750.25,
    status: "Completed",
    paymentStatus: "Overdue"
  },
  {
    id: "5",
    transactionNumber: "INV-2023-0046",
    date: "2023-04-19",
    customer: "Umbrella Corp",
    amount: 3600.00,
    status: "Cancelled",
    paymentStatus: "Refunded"
  }
];

const getSaleStatusBadge = (status: string) => {
  switch (status) {
    case 'Completed':
      return <Badge className="bg-green-500">Completed</Badge>;
    case 'Pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'Cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case 'Paid':
      return <Badge className="bg-green-500">Paid</Badge>;
    case 'Pending':
      return <Badge variant="secondary">Pending</Badge>;
    case 'Overdue':
      return <Badge variant="destructive">Overdue</Badge>;
    case 'Refunded':
      return <Badge variant="outline">Refunded</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const Sales: React.FC = () => {
  const navigate = useNavigate();
  
  const handleViewSale = (id: string) => {
    navigate(`/sales/${id}`);
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
        <Button>New Sale</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>Manage and view all sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.transactionNumber}</TableCell>
                  <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.customer}</TableCell>
                  <TableCell>{formatCurrency(sale.amount)}</TableCell>
                  <TableCell>{getSaleStatusBadge(sale.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(sale.paymentStatus)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewSale(sale.id)}
                    >
                      View
                    </Button>
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

export default Sales;
