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
import { PlusIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const mockSales = [
  {
    id: "1",
    saleNumber: "SALE 001",
    date: "2023-04-15",
    customer: "Acme Corporation",
    employee: "John Smith",
    unitPrice: 125.00,
    currentPrice: 150.00,
    amount: 2592.00,
  },
  {
    id: "2",
    saleNumber: "SALE 002",
    date: "2023-04-16",
    customer: "Globex Inc.",
    employee: "Sarah Johnson",
    unitPrice: 85.25,
    currentPrice: 95.50,
    amount: 1850.50,
  },
  {
    id: "3",
    saleNumber: "SALE 003",
    date: "2023-04-17",
    customer: "Stark Industries",
    employee: "Michael Brown",
    unitPrice: 210.50,
    currentPrice: 245.75,
    amount: 4200.75,
  },
  {
    id: "4",
    saleNumber: "SALE 004",
    date: "2023-04-18",
    customer: "Wayne Enterprises",
    employee: "Emily Davis",
    unitPrice: 89.25,
    currentPrice: 102.50,
    amount: 1750.25,
  },
  {
    id: "5",
    saleNumber: "SALE 005",
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
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [openEmployee, setOpenEmployee] = useState(false);
  const [openProduct, setOpenProduct] = useState(false);
  
  const [newSale, setNewSale] = useState({
    customer: "",
    employee: "",
    product: "",
    unitPrice: 0,
    currentPrice: 0,
    amount: "",
    date: new Date().toISOString().split('T')[0]
  });

  const [sales, setSales] = useState(mockSales);

  const [customerSearch, setCustomerSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const filteredCustomers = customers.filter(customer => 
    customer.custname?.toLowerCase().includes(customerSearch.toLowerCase())
  );
  
  const filteredEmployees = employees.filter(employee => 
    `${employee.firstname} ${employee.lastname}`.toLowerCase().includes(employeeSearch.toLowerCase())
  );
  
  const filteredProducts = products.filter(product => 
    product.description?.toLowerCase().includes(productSearch.toLowerCase())
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, customersData, employeesData] = await Promise.all([
          supabase.from('product').select('*'),
          supabase.from('customer').select('*'),
          supabase.from('employee').select('*')
        ]);
        
        if (productsData.data) setProducts(productsData.data);
        if (customersData.data) setCustomers(customersData.data);
        if (employeesData.data) setEmployees(employeesData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleProductSelect = async (productCode: string) => {
    try {
      const { data: priceData } = await supabase
        .from('pricehist')
        .select('unitprice')
        .eq('prodcode', productCode)
        .order('effdate', { ascending: false })
        .limit(1);

      if (priceData && priceData.length > 0) {
        setNewSale(prev => ({
          ...prev,
          product: productCode,
          unitPrice: priceData[0].unitprice,
          currentPrice: priceData[0].unitprice
        }));
      }
    } catch (error) {
      console.error('Error fetching product price:', error);
    }
  };
  
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
      product: "",
      unitPrice: 0,
      currentPrice: 0,
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
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.saleNumber}</TableCell>
                  <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.customer}</TableCell>
                  <TableCell>{sale.employee}</TableCell>
                  <TableCell>{formatCurrency(sale.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(sale.currentPrice)}</TableCell>
                  <TableCell>{formatCurrency(sale.amount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewSale(sale.id)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                <Input 
                  placeholder="Search customers..." 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                {customerSearch && (
                  <Command className="rounded-lg border shadow-md mt-2">
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {filteredCustomers.map((customer) => (
                          <CommandItem
                            key={customer.custno}
                            onSelect={() => {
                              setNewSale({...newSale, customer: customer.custname || ''});
                              setCustomerSearch("");
                            }}
                          >
                            {customer.custname}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee" className="text-right">
                Employee
              </Label>
              <div className="col-span-3">
                <Input 
                  placeholder="Search employees..." 
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                />
                {employeeSearch && (
                  <Command className="rounded-lg border shadow-md mt-2">
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup>
                        {filteredEmployees.map((employee) => (
                          <CommandItem
                            key={employee.empno}
                            onSelect={() => {
                              setNewSale({...newSale, employee: `${employee.firstname} ${employee.lastname}`});
                              setEmployeeSearch("");
                            }}
                          >
                            {`${employee.firstname} ${employee.lastname}`}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product" className="text-right">
                Product
              </Label>
              <div className="col-span-3">
                <Input 
                  placeholder="Search products..." 
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch && (
                  <Command className="rounded-lg border shadow-md mt-2">
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup>
                        {filteredProducts.map((product) => (
                          <CommandItem
                            key={product.prodcode}
                            onSelect={() => {
                              setSelectedProduct(product);
                              handleProductSelect(product.prodcode);
                              setProductSearch("");
                            }}
                          >
                            {product.description}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unitPrice" className="text-right">
                Unit Price
              </Label>
              <Input
                id="unitPrice"
                value={newSale.unitPrice}
                className="col-span-3"
                disabled
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentPrice" className="text-right">
                Current Price
              </Label>
              <Input
                id="currentPrice"
                value={newSale.currentPrice}
                className="col-span-3"
                disabled
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
