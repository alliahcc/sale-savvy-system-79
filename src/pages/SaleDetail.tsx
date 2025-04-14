
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Sample sale data - would be fetched from API in a real application
const saleData = {
  id: "1",
  transactionNumber: "INV-2023-0042",
  customerName: "Acme Corporation",
  date: "2023-04-15",
  salesPerson: "John Smith",
  status: "Completed",
  paymentStatus: "Paid",
  subTotal: 2400.00,
  tax: 192.00,
  total: 2592.00,
  items: [
    { id: "1", product: "Premium Widget", quantity: 12, unitPrice: 120.00, total: 1440.00 },
    { id: "2", product: "Deluxe Gadget", quantity: 8, unitPrice: 120.00, total: 960.00 }
  ],
  notes: "Customer requested expedited shipping. Shipped via express delivery."
};

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

const SaleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // In a real app, you would fetch the sale details based on the ID
  // const { data: saleData, isLoading, error } = useFetchSaleDetails(id);

  const handleBackClick = () => {
    navigate('/sales');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center">
        <Button variant="outline" size="icon" onClick={handleBackClick} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sale Details</h2>
          <p className="text-muted-foreground">Transaction #{saleData.transactionNumber}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sale Information</CardTitle>
            <CardDescription>Details about this sale transaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Customer</h4>
                <p className="font-medium">{saleData.customerName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Date</h4>
                <p className="font-medium">{new Date(saleData.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Sales Person</h4>
                <p className="font-medium">{saleData.salesPerson}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                <div>{getSaleStatusBadge(saleData.status)}</div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Payment Status</h4>
                <div>{getPaymentStatusBadge(saleData.paymentStatus)}</div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <h3 className="font-semibold mb-4">Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleData.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(saleData.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>{formatCurrency(saleData.tax)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(saleData.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional sale information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{saleData.notes}</p>
            
            <div className="mt-6 pt-6 border-t space-y-4">
              <Button className="w-full">Edit Sale</Button>
              <Button variant="outline" className="w-full">Print Invoice</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SaleDetail;
