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

interface SaleWithDetails {
  id: string;
  saleNumber: string;
  date: string;
  customer: string;
  employee: string;
  product: string;
  quantity: number;
  unitPrice: number;
  currentPrice: number;
  amount: number;
}

const mockSales = [
  {
    id: "1",
    saleNumber: "SALE 001",
    date: "2023-04-15",
    customer: "Acme Corporation",
    employee: "John Smith",
    product: "Product A",
    quantity: 2,
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
    product: "Product B",
    quantity: 3,
    unitPrice: 85.25,
    currentPrice: 95.50,
    amount: 2776.50,
  },
  {
    id: "3",
    saleNumber: "SALE 003",
    date: "2023-04-17",
    customer: "Stark Industries",
    employee: "Michael Brown",
    product: "Product C",
    quantity: 4,
    unitPrice: 210.50,
    currentPrice: 245.75,
    amount: 8820.00,
  },
  {
    id: "4",
    saleNumber: "SALE 004",
    date: "2023-04-18",
    customer: "Wayne Enterprises",
    employee: "Emily Davis",
    product: "Product D",
    quantity: 5,
    unitPrice: 89.25,
    currentPrice: 102.50,
    amount: 4462.50,
  },
  {
    id: "5",
    saleNumber: "SALE 005",
    date: "2023-04-19",
    customer: "Umbrella Corp",
    employee: "David Wilson",
    product: "Product E",
    quantity: 6,
    unitPrice: 178.50,
    currentPrice: 198.75,
    amount: 11910.00,
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
    quantity: 1,
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [salesData, setSalesData] = useState<SaleWithDetails[]>([]);

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

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const { data: salesDetails, error: salesError } = await supabase
          .from('sales')
          .select(`
            transno,
            salesdate,
            customer:custno (custname),
            employee:empno (firstname, lastname),
            salesdetail (
              quantity,
              product:prodcode (
                description,
                prodcode
              )
            )
          `);

        if (salesError) throw salesError;

        if (salesDetails) {
          const productCodes = salesDetails
            .flatMap(sale => sale.salesdetail?.map(detail => detail.product?.prodcode))
            .filter(Boolean);

          const { data: allPriceData } = await supabase
            .from('pricehist')
            .select('prodcode, unitprice, effdate')
            .in('prodcode', productCodes);

          const { data: currentPriceData } = await supabase
            .from('pricehist')
            .select('prodcode, unitprice, effdate')
            .in('prodcode', productCodes)
            .order('effdate', { ascending: false });

          const latestPrices = currentPriceData?.reduce((acc: Record<string, number>, curr) => {
            if (!acc[curr.prodcode]) {
              acc[curr.prodcode] = curr.unitprice;
            }
            return acc;
          }, {});

          const historicalPrices = allPriceData?.reduce((acc: Record<string, Array<{unitprice: number, effdate: string}>>, curr) => {
            if (!acc[curr.prodcode]) {
              acc[curr.prodcode] = [];
            }
            acc[curr.prodcode].push({ unitprice: curr.unitprice, effdate: curr.effdate });
            return acc;
          }, {});

          const formattedSales: SaleWithDetails[] = salesDetails.map((sale: any) => {
            const product = sale.salesdetail?.[0]?.product?.description || 'N/A';
            const quantity = sale.salesdetail?.[0]?.quantity || 0;
            const prodCode = sale.salesdetail?.[0]?.product?.prodcode;
            const saleDate = sale.salesdate;
            
            let unitPrice = 0;
            if (historicalPrices?.[prodCode]) {
              const pricesBeforeSale = historicalPrices[prodCode]
                .filter(price => new Date(price.effdate) <= new Date(saleDate))
                .sort((a, b) => new Date(b.effdate).getTime() - new Date(a.effdate).getTime());
              
              unitPrice = pricesBeforeSale[0]?.unitprice || 0;
            }

            return {
              id: sale.transno,
              saleNumber: `SALE ${sale.transno}`,
              date: sale.salesdate,
              customer: sale.customer?.custname || 'N/A',
              employee: `${sale.employee?.firstname || ''} ${sale.employee?.lastname || ''}`.trim() || 'N/A',
              product,
              quantity,
              unitPrice,
              currentPrice: latestPrices?.[prodCode] || 0,
              amount: quantity * unitPrice
            };
          });

          setSalesData(formattedSales);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  const handleProductSelect = async (productCode: string) => {
    try {
      const { data: priceData } = await supabase
        .from('pricehist')
        .select('unitprice')
        .eq('prodcode', productCode)
        .order('effdate', { ascending: false })
        .limit(1);

      const selectedProduct = products.find(p => p.prodcode === productCode);

      if (priceData && priceData.length > 0) {
        setNewSale(prev => ({
          ...prev,
          product: productCode,
          unitPrice: priceData[0].unitprice,
          currentPrice: priceData[0].unitprice,
          amount: priceData[0].unitprice * prev.quantity
        }));
      }
    } catch (error) {
      console.error('Error fetching product price:', error);
    }
  };

  const handleQuantityChange = (quantity: number) => {
    setNewSale(prev => ({
      ...prev,
      quantity,
      amount: prev.currentPrice * quantity
    }));
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
      quantity: 1,
      amount: 0,
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
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : salesData.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.saleNumber}</TableCell>
                  <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                  <TableCell>{sale.customer}</TableCell>
                  <TableCell>{sale.employee}</TableCell>
                  <TableCell>{sale.product}</TableCell>
                  <TableCell>{sale.quantity}</TableCell>
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
        <DialogContent className="sm:max-w-[800px]">
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
                  placeholder={newSale.customer || "Search customers..."}
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
                              setCustomerSearch('');
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
                  placeholder={newSale.employee || "Search employees..."}
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
                  placeholder={newSale.product || "Search products..."}
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
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={newSale.quantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                value={formatCurrency(newSale.amount)}
                className="col-span-3"
                disabled
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
