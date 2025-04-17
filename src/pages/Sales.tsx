
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
import { useToast } from '@/hooks/use-toast';
import { PlusIcon, Loader2, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

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

interface SaleItem {
  productId: string;
  product: string;
  quantity: number;
  unitPrice: number;
  currentPrice: number;
  amount: number;
}

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
  const [customerSearch, setCustomerSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [currentProductItem, setCurrentProductItem] = useState<SaleItem>({
    productId: "",
    product: "",
    quantity: 1,
    unitPrice: 0,
    currentPrice: 0,
    amount: 0
  });
  
  const [newSale, setNewSale] = useState({
    customer: "",
    customerId: "",
    employee: "",
    employeeId: "",
    date: new Date().toISOString().split('T')[0],
    items: [] as SaleItem[],
    totalAmount: 0
  });

  const [salesData, setSalesData] = useState<SaleWithDetails[]>([]);

  const filteredCustomers = customers.filter(customer => 
    customer.custname?.toLowerCase().startsWith(customerSearch.toLowerCase())
  );
  
  const filteredEmployees = employees.filter(employee => 
    `${employee.firstname} ${employee.lastname}`.toLowerCase().startsWith(employeeSearch.toLowerCase())
  );
  
  const filteredProducts = products.filter(product => 
    product.description?.toLowerCase().startsWith(productSearch.toLowerCase())
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
      // Get the product description
      const selectedProduct = products.find(p => p.prodcode === productCode);
      
      if (!selectedProduct) {
        console.error('Product not found');
        return;
      }
      
      // Get the current price (most recent price)
      const { data: currentPriceData } = await supabase
        .from('pricehist')
        .select('unitprice')
        .eq('prodcode', productCode)
        .order('effdate', { ascending: false })
        .limit(1);
      
      const currentPrice = currentPriceData && currentPriceData.length > 0 
        ? currentPriceData[0].unitprice 
        : 0;

      // Update the current product item
      setCurrentProductItem({
        productId: productCode,
        product: selectedProduct.description || '',
        quantity: 1,
        unitPrice: currentPrice, // Initially same as current price, will be the original price when added
        currentPrice: currentPrice,
        amount: currentPrice
      });
    } catch (error) {
      console.error('Error fetching product price:', error);
    }
  };

  const handleQuantityChange = (quantity: number) => {
    setCurrentProductItem(prev => ({
      ...prev,
      quantity,
      amount: prev.unitPrice * quantity
    }));
  };
  
  const handleAddProductToSale = () => {
    if (!currentProductItem.productId) {
      toast({
        title: "Error",
        description: "Please select a product first",
        variant: "destructive"
      });
      return;
    }
    
    // Add the current product to the items array
    setNewSale(prev => {
      const updatedItems = [...prev.items, currentProductItem];
      const totalAmount = updatedItems.reduce((total, item) => total + item.amount, 0);
      
      return {
        ...prev,
        items: updatedItems,
        totalAmount
      };
    });
    
    // Reset the current product
    setCurrentProductItem({
      productId: "",
      product: "",
      quantity: 1,
      unitPrice: 0,
      currentPrice: 0,
      amount: 0
    });
    
    setProductSearch("");
  };
  
  const handleRemoveItem = (index: number) => {
    setNewSale(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const totalAmount = updatedItems.reduce((total, item) => total + item.amount, 0);
      
      return {
        ...prev,
        items: updatedItems,
        totalAmount
      };
    });
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
      customerId: "",
      employee: "",
      employeeId: "",
      date: new Date().toISOString().split('T')[0],
      items: [],
      totalAmount: 0
    });
    setCurrentProductItem({
      productId: "",
      product: "",
      quantity: 1,
      unitPrice: 0,
      currentPrice: 0,
      amount: 0
    });
    setCustomerSearch("");
    setEmployeeSearch("");
    setProductSearch("");
  };
  
  const handleNewSaleSubmit = async () => {
    // Validation
    if (!newSale.customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive"
      });
      return;
    }
    
    if (!newSale.employeeId) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive"
      });
      return;
    }
    
    if (newSale.items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive"
      });
      return;
    }
    
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
          
          <div className="flex justify-between items-center">
            <div></div> {/* Empty div for spacing */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="date">Date:</Label>
              <Input
                id="date"
                type="date"
                value={newSale.date}
                onChange={(e) => setNewSale({...newSale, date: e.target.value})}
                className="w-40"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Input 
                placeholder={newSale.customer || "Search customers..."}
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {customerSearch && (
                <Command className="rounded-lg border shadow-md mt-2 absolute z-10 bg-white w-[calc(50%-1rem)]">
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCustomers.map((customer) => (
                        <CommandItem
                          key={customer.custno}
                          onSelect={() => {
                            setNewSale({
                              ...newSale, 
                              customer: customer.custname || '',
                              customerId: customer.custno
                            });
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

            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Input 
                placeholder={newSale.employee || "Search employees..."}
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
              />
              {employeeSearch && (
                <Command className="rounded-lg border shadow-md mt-2 absolute z-10 bg-white w-[calc(50%-1rem)]">
                  <CommandList>
                    <CommandEmpty>No employee found.</CommandEmpty>
                    <CommandGroup>
                      {filteredEmployees.map((employee) => (
                        <CommandItem
                          key={employee.empno}
                          onSelect={() => {
                            setNewSale({
                              ...newSale, 
                              employee: `${employee.firstname} ${employee.lastname}`,
                              employeeId: employee.empno
                            });
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
          
          <div className="flex flex-col space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="product">Product</Label>
                <Input 
                  placeholder={currentProductItem.product || "Search products..."}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                {productSearch && (
                  <Command className="rounded-lg border shadow-md mt-2 absolute z-10 bg-white w-[calc(50%-1rem)]">
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
              
              <div className="w-24 space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={currentProductItem.quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                />
              </div>
              
              <div className="w-32 space-y-2">
                <Label htmlFor="unitPrice">Unit Price</Label>
                <Input
                  id="unitPrice"
                  value={formatCurrency(currentProductItem.unitPrice)}
                  disabled
                />
              </div>
              
              <div className="w-32 space-y-2">
                <Label htmlFor="currentPrice">Current Price</Label>
                <Input
                  id="currentPrice"
                  value={formatCurrency(currentProductItem.currentPrice)}
                  disabled
                />
              </div>
              
              <Button onClick={handleAddProductToSale} disabled={!currentProductItem.productId}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="border rounded p-2">
              <div className="font-bold mb-2">Cart Items</div>
              {newSale.items.length === 0 ? (
                <div className="text-muted-foreground text-center p-4">No items added yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Current Price</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newSale.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.currentPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
                      <TableCell colSpan={2} className="font-bold">{formatCurrency(newSale.totalAmount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
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
