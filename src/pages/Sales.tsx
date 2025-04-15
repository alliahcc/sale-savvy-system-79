import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { PlusIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import ProductList from '@/components/ProductList';

// Enhanced sales data structure
type SalesData = {
  id: string;
  transactionNumber: string;
  date: string;
  customer: string;
  employee: string;
  unitPrice: number;
  currentPrice: number;
  amount: number;
};

// Mock data for initial rendering
const mockSales: SalesData[] = [
  {
    id: "1",
    transactionNumber: "INV-2023-0042",
    date: "2023-04-15",
    customer: "Acme Corporation",
    employee: "John Smith",
    unitPrice: 125.00,
    currentPrice: 150.00,
    amount: 2592.00,
  },
  {
    id: "2",
    transactionNumber: "INV-2023-0043",
    date: "2023-04-16",
    customer: "Globex Inc.",
    employee: "Sarah Johnson",
    unitPrice: 85.25,
    currentPrice: 95.50,
    amount: 1850.50,
  },
  {
    id: "3",
    transactionNumber: "INV-2023-0044",
    date: "2023-04-17",
    customer: "Stark Industries",
    employee: "Michael Brown",
    unitPrice: 210.50,
    currentPrice: 245.75,
    amount: 4200.75,
  },
  {
    id: "4",
    transactionNumber: "INV-2023-0045",
    date: "2023-04-18",
    customer: "Wayne Enterprises",
    employee: "Emily Davis",
    unitPrice: 89.25,
    currentPrice: 102.50,
    amount: 1750.25,
  },
  {
    id: "5",
    transactionNumber: "INV-2023-0046",
    date: "2023-04-19",
    customer: "Umbrella Corp",
    employee: "David Wilson",
    unitPrice: 178.50,
    currentPrice: 198.75,
    amount: 3600.00,
  }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const Sales: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isNewSaleDialogOpen, setIsNewSaleDialogOpen] = useState(false);
  const [newSale, setNewSale] = useState({
    customer: "",
    employee: "",
    unitPrice: "",
    currentPrice: "",
    amount: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [sales, setSales] = useState<SalesData[]>(mockSales);
  const [loading, setLoading] = useState(false);
  
  // Fetch real sales data from Supabase
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        
        // This is a placeholder - in a real application, you would:
        // 1. Fetch sales data, joining with customer and employee tables
        // 2. Fetch product pricing data
        // 3. Combine the data to show the requested information
        
        // For now, we'll just use the mock data
        setSales(mockSales);
      } catch (error) {
        console.error('Error fetching sales data:', error);
        toast({
          title: "Error",
          description: "Failed to load sales data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSalesData();
  }, [toast]);
  
  const handleViewSale = (id: string) => {
    navigate(`/sales/${id}`);
  };
  
  const handleNewSaleOpen = () => {
    setIsNewSaleDialogOpen(true);
  };
  
  const handleNewSaleClose = () => {
    setIsNewSaleDialogOpen(false);
    setNewSale({
      customer: "",
      employee: "",
      unitPrice: "",
      currentPrice: "",
      amount: "",
      date: new Date().toISOString().split('T')[0]
    });
  };
  
  const handleNewSaleSubmit = () => {
    toast({
      title: "Sale created",
      description: `New sale created for ${newSale.customer}`,
    });
    handleNewSaleClose();
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
        <Button onClick={handleNewSaleOpen}>
          <PlusIcon className="mr-2 h-4 w-4" /> New Sale
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>Manage and view all sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">No sales found</TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.transactionNumber}</TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.customer}</TableCell>
                      <TableCell>{sale.employee}</TableCell>
                      <TableCell>{formatCurrency(sale.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(sale.currentPrice)}</TableCell>
                      <TableCell>{formatCurrency(sale.amount)}</TableCell>
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
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isNewSaleDialogOpen} onOpenChange={setIsNewSaleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Sale</DialogTitle>
            <DialogDescription>
              Enter the details for the new sale.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="text-right">
                Customer
              </Label>
              <div className="col-span-3">
                <Select 
                  onValueChange={(value) => setNewSale({...newSale, customer: value})}
                  value={newSale.customer}
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acme Corporation">Acme Corporation</SelectItem>
                    <SelectItem value="Globex Inc.">Globex Inc.</SelectItem>
                    <SelectItem value="Stark Industries">Stark Industries</SelectItem>
                    <SelectItem value="Wayne Enterprises">Wayne Enterprises</SelectItem>
                    <SelectItem value="Umbrella Corp">Umbrella Corp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee" className="text-right">
                Employee
              </Label>
              <div className="col-span-3">
                <Select 
                  onValueChange={(value) => setNewSale({...newSale, employee: value})}
                  value={newSale.employee}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="John Smith">John Smith</SelectItem>
                    <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="Michael Brown">Michael Brown</SelectItem>
                    <SelectItem value="Emily Davis">Emily Davis</SelectItem>
                    <SelectItem value="David Wilson">David Wilson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unitPrice" className="text-right">
                Unit Price
              </Label>
              <Input
                id="unitPrice"
                type="number"
                value={newSale.unitPrice}
                onChange={(e) => setNewSale({...newSale, unitPrice: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentPrice" className="text-right">
                Current Price
              </Label>
              <Input
                id="currentPrice"
                type="number"
                value={newSale.currentPrice}
                onChange={(e) => setNewSale({...newSale, currentPrice: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={newSale.amount}
                onChange={(e) => setNewSale({...newSale, amount: e.target.value})}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={newSale.date}
                onChange={(e) => setNewSale({...newSale, date: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleNewSaleClose}>Cancel</Button>
            <Button onClick={handleNewSaleSubmit}>Create Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
