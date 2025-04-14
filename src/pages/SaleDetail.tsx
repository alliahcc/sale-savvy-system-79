
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Edit, Trash2, Download, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Sample sales data (same as in Sales.tsx)
const salesData = [
  {
    id: '1',
    customerName: 'Alice Johnson',
    customerEmail: 'alice.johnson@example.com',
    customerPhone: '(555) 123-4567',
    product: 'Premium Plan',
    productDetails: 'Annual subscription with premium support',
    amount: 299.99,
    status: 'completed',
    date: '2023-04-12',
    paymentMethod: 'Credit Card',
    salesRep: 'John Davis',
    notes: 'Customer requested information about enterprise upgrade options for next year.'
  },
  {
    id: '2',
    customerName: 'Bob Smith',
    customerEmail: 'bob.smith@example.com',
    customerPhone: '(555) 987-6543',
    product: 'Basic Plan',
    productDetails: 'Monthly subscription',
    amount: 99.99,
    status: 'processing',
    date: '2023-04-10',
    paymentMethod: 'PayPal',
    salesRep: 'Emily Wilson',
    notes: 'First-time customer, referred by Alice Johnson.'
  },
  {
    id: '3',
    customerName: 'Charlie Brown',
    customerEmail: 'charlie.brown@example.com',
    customerPhone: '(555) 456-7890',
    product: 'Enterprise Plan',
    productDetails: 'Custom solution with dedicated support',
    amount: 599.99,
    status: 'completed',
    date: '2023-04-08',
    paymentMethod: 'Wire Transfer',
    salesRep: 'Michael Scott',
    notes: 'Long-time customer upgrading from Premium plan.'
  },
  {
    id: '4',
    customerName: 'Diana Prince',
    customerEmail: 'diana.prince@example.com',
    customerPhone: '(555) 234-5678',
    product: 'Premium Plan',
    productDetails: 'Annual subscription with premium support',
    amount: 299.99,
    status: 'failed',
    date: '2023-04-05',
    paymentMethod: 'Credit Card',
    salesRep: 'Sarah Johnson',
    notes: 'Payment failed due to expired card. Follow up required.'
  },
  {
    id: '5',
    customerName: 'Edward Norton',
    customerEmail: 'edward.norton@example.com',
    customerPhone: '(555) 876-5432',
    product: 'Basic Plan',
    productDetails: 'Monthly subscription',
    amount: 99.99,
    status: 'completed',
    date: '2023-04-03',
    paymentMethod: 'Credit Card',
    salesRep: 'John Davis',
    notes: 'Customer interested in upgrade options.'
  },
  {
    id: '6',
    customerName: 'Frank Castle',
    customerEmail: 'frank.castle@example.com',
    customerPhone: '(555) 345-6789',
    product: 'Enterprise Plan',
    productDetails: 'Custom solution with dedicated support',
    amount: 599.99,
    status: 'processing',
    date: '2023-04-01',
    paymentMethod: 'Check',
    salesRep: 'Emily Wilson',
    notes: 'Check received, waiting for clearance.'
  },
  {
    id: '7',
    customerName: 'Grace Kelly',
    customerEmail: 'grace.kelly@example.com',
    customerPhone: '(555) 789-0123',
    product: 'Premium Plan',
    productDetails: 'Annual subscription with premium support',
    amount: 299.99,
    status: 'completed',
    date: '2023-03-29',
    paymentMethod: 'Credit Card',
    salesRep: 'Michael Scott',
    notes: 'Renewal - satisfied with service.'
  },
  {
    id: '8',
    customerName: 'Henry Ford',
    customerEmail: 'henry.ford@example.com',
    customerPhone: '(555) 432-1098',
    product: 'Basic Plan',
    productDetails: 'Monthly subscription',
    amount: 99.99,
    status: 'failed',
    date: '2023-03-27',
    paymentMethod: 'PayPal',
    salesRep: 'Sarah Johnson',
    notes: 'PayPal account issue. Customer to update payment method.'
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

const SaleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, this would be an API call
    const fetchSale = () => {
      setLoading(true);
      const foundSale = salesData.find(s => s.id === id);
      
      setTimeout(() => {
        if (foundSale) {
          setSale(foundSale);
        } else {
          toast({
            title: "Sale not found",
            description: `We couldn't find a sale with ID ${id}`,
            variant: "destructive"
          });
          navigate('/sales');
        }
        setLoading(false);
      }, 500);
    };

    fetchSale();
  }, [id, navigate, toast]);

  const handleDelete = () => {
    // In a real app, this would call an API to delete the sale
    toast({
      title: "Sale deleted",
      description: `Sale ${id} has been deleted successfully`,
    });
    navigate('/sales');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading sale details...</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return null; // Navigate happened in useEffect
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" onClick={() => navigate('/sales')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Sales
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Sale Details</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Send className="h-4 w-4" /> Send
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Edit className="h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-destructive hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sale Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Sale Summary</CardTitle>
            <CardDescription>Overview of the sale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sale ID</p>
                <p className="font-medium">{sale.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(sale.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <StatusBadge status={sale.status} />
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Product</p>
              <p className="font-medium">{sale.product}</p>
              <p className="text-sm text-muted-foreground mt-1">{sale.productDetails}</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="text-3xl font-bold text-primary">${sale.amount.toFixed(2)}</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
              <p className="font-medium">{sale.paymentMethod}</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sales Representative</p>
              <p className="font-medium">{sale.salesRep}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Details about the customer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-medium">{sale.customerName}</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{sale.customerEmail}</p>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="font-medium">{sale.customerPhone}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes & Additional Information</CardTitle>
            <CardDescription>Additional details about this sale</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{sale.notes}</p>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Last updated: {new Date(sale.date).toLocaleString()}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SaleDetail;
