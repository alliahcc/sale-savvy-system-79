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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { PlusIcon, Loader2, Pencil, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface SaleWithDetails {
  id: string;
  saleNumber: string;
  date: string;
  customer: string;
  employee: string;
  products: {
    product: string;
    quantity: number;
    unitPrice: number;
    currentPrice: number;
    amount: number;
  }[];
  totalAmount: number;
}

interface SaleItem {
  productId: string;
  product: string;
  quantity: number;
  unitPrice: number;
  currentPrice: number;
  amount: number;
  isEditing?: boolean;
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
  const [isEditSaleDialogOpen, setIsEditSaleDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [currentEditingSale, setCurrentEditingSale] = useState<string | null>(null);
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
  
  const [editSale, setEditSale] = useState({
    id: "",
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

        if (salesError) {
          console.error('Error fetching sales:', salesError);
          toast({
            title: "Error",
            description: "Failed to fetch sales data",
            variant: "destructive"
          });
          return;
        }

        if (salesDetails) {
          const productCodes = salesDetails
            .flatMap(sale => sale.salesdetail?.map(detail => detail.product?.prodcode))
            .filter(Boolean);

          const { data: allPriceData, error: priceError } = await supabase
            .from('pricehist')
            .select('prodcode, unitprice, effdate')
            .in('prodcode', productCodes);

          if (priceError) {
            console.error('Error fetching prices:', priceError);
            return;
          }

          const { data: currentPriceData, error: currentPriceError } = await supabase
            .from('pricehist')
            .select('prodcode, unitprice, effdate')
            .in('prodcode', productCodes)
            .order('effdate', { ascending: false });

          if (currentPriceError) {
            console.error('Error fetching current prices:', currentPriceError);
            return;
          }

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
            const products = sale.salesdetail?.map((detail: any) => {
              const prodCode = detail.product?.prodcode;
              const saleDate = sale.salesdate;
              
              let unitPrice = 0;
              if (historicalPrices?.[prodCode]) {
                const pricesBeforeSale = historicalPrices[prodCode]
                  .filter(price => new Date(price.effdate) <= new Date(saleDate))
                  .sort((a, b) => new Date(b.effdate).getTime() - new Date(a.effdate).getTime());
                
                unitPrice = pricesBeforeSale[0]?.unitprice || 0;
              }

              const currentPrice = latestPrices?.[prodCode] || 0;
              const amount = detail.quantity * currentPrice;

              return {
                product: detail.product?.description || 'N/A',
                quantity: detail.quantity || 0,
                unitPrice,
                currentPrice,
                amount
              };
            }) || [];

            const totalAmount = products.reduce((sum: number, product: any) => sum + product.amount, 0);

            return {
              id: sale.transno,
              saleNumber: sale.transno,
              date: sale.salesdate,
              customer: sale.customer?.custname || 'N/A',
              employee: `${sale.employee?.firstname || ''} ${sale.employee?.lastname || ''}`.trim() || 'N/A',
              products,
              totalAmount
            };
          });

          // Filter out empty sales with no products or zero total amount
          const filteredSales = formattedSales.filter(sale => 
            sale.products.length > 0 && sale.totalAmount > 0
          );

          // Sort by TR number in ascending order
          filteredSales.sort((a, b) => {
            const aNum = parseInt(a.saleNumber.replace('TR', ''), 10) || 0;
            const bNum = parseInt(b.saleNumber.replace('TR', ''), 10) || 0;
            return aNum - bNum;
          });

          setSalesData(filteredSales);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch sales data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [toast]);

  const handleProductSelect = async (productCode: string) => {
    try {
      const selectedProduct = products.find(p => p.prodcode === productCode);
      
      if (!selectedProduct) {
        console.error('Product not found');
        return;
      }
      
      const { data: priceHistoryData, error } = await supabase
        .from('pricehist')
        .select('unitprice, effdate')
        .eq('prodcode', productCode)
        .order('effdate', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      const originalPrice = priceHistoryData && priceHistoryData.length > 0 
        ? priceHistoryData[0].unitprice 
        : 0;
      
      const currentPrice = priceHistoryData && priceHistoryData.length > 0 
        ? priceHistoryData[priceHistoryData.length - 1].unitprice 
        : 0;

      setCurrentProductItem({
        productId: productCode,
        product: selectedProduct.description || '',
        quantity: 1,
        unitPrice: originalPrice,
        currentPrice: currentPrice,
        amount: currentPrice
      });
      
      setShowProductDropdown(false);
      setProductSearch(selectedProduct.description || '');
    } catch (error) {
      console.error('Error fetching product price:', error);
    }
  };

  const handleQuantityChange = (quantity: number) => {
    setCurrentProductItem(prev => ({
      ...prev,
      quantity,
      amount: prev.currentPrice * quantity
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
    
    if (isEditSaleDialogOpen) {
      setEditSale(prev => {
        const updatedItems = [...prev.items, currentProductItem];
        const totalAmount = updatedItems.reduce((total, item) => total + item.amount, 0);
        
        return {
          ...prev,
          items: updatedItems,
          totalAmount
        };
      });
    } else {
      setNewSale(prev => {
        const updatedItems = [...prev.items, currentProductItem];
        const totalAmount = updatedItems.reduce((total, item) => total + item.amount, 0);
        
        return {
          ...prev,
          items: updatedItems,
          totalAmount
        };
      });
    }
    
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

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    let itemToEdit: SaleItem;
    
    if (isEditSaleDialogOpen) {
      itemToEdit = editSale.items[index];
    } else {
      itemToEdit = newSale.items[index];
    }

    setCurrentProductItem({
      ...itemToEdit
    });

    setProductSearch(itemToEdit.product);
  };

  const handleSaveEdit = (index: number) => {
    if (!currentProductItem.productId) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive"
      });
      return;
    }

    if (isEditSaleDialogOpen) {
      setEditSale(prev => {
        const updatedItems = [...prev.items];
        updatedItems[index] = {
          ...currentProductItem,
          amount: currentProductItem.currentPrice * currentProductItem.quantity
        };
        
        const totalAmount = updatedItems.reduce((total, item) => total + item.amount, 0);
        
        return {
          ...prev,
          items: updatedItems,
          totalAmount
        };
      });
    } else {
      setNewSale(prev => {
        const updatedItems = [...prev.items];
        updatedItems[index] = {
          ...currentProductItem,
          amount: currentProductItem.currentPrice * currentProductItem.quantity
        };
        
        const totalAmount = updatedItems.reduce((total, item) => total + item.amount, 0);
        
        return {
          ...prev,
          items: updatedItems,
          totalAmount
        };
      });
    }
    
    setEditingItemIndex(null);
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
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      setCurrentProductItem({
        productId: "",
        product: "",
        quantity: 1,
        unitPrice: 0,
        currentPrice: 0,
        amount: 0
      });
      setProductSearch("");
    }

    if (isEditSaleDialogOpen) {
      setEditSale(prev => {
        const updatedItems = prev.items.filter((_, i) => i !== index);
        const totalAmount = updatedItems.reduce((total, item) => total + item.amount, 0);
        
        return {
          ...prev,
          items: updatedItems,
          totalAmount
        };
      });
    } else {
      setNewSale(prev => {
        const updatedItems = prev.items.filter((_, i) => i !== index);
        const totalAmount = updatedItems.reduce((total, item) => total + item.amount, 0);
        
        return {
          ...prev,
          items: updatedItems,
          totalAmount
        };
      });
    }
  };
  
  const handleViewSale = (id: string) => {
    navigate(`/sales/${id}`);
  };

  const handleEditSale = async (id: string) => {
    try {
      const sale = salesData.find(sale => sale.id === id);
      if (!sale) {
        toast({
          title: "Error",
          description: "Sale not found",
          variant: "destructive"
        });
        return;
      }
      
      setCurrentEditingSale(id);
      
      const { data: saleDetail, error: saleDetailError } = await supabase
        .from('sales')
        .select('custno, empno, salesdate')
        .eq('transno', id)
        .single();
      
      if (saleDetailError) {
        console.error('Error fetching sale details:', saleDetailError);
        toast({
          title: "Error",
          description: "Failed to fetch sale details",
          variant: "destructive"
        });
        return;
      }
      
      const customer = customers.find(cust => cust.custno === saleDetail.custno);
      const employee = employees.find(emp => emp.empno === saleDetail.empno);
      
      const items = sale.products.map(product => {
        const productData = products.find(p => p.description === product.product);
        return {
          productId: productData?.prodcode || '',
          product: product.product,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          currentPrice: product.currentPrice,
          amount: product.quantity * product.currentPrice
        };
      });
      
      setEditSale({
        id: id,
        customer: sale.customer,
        customerId: saleDetail.custno || '',
        employee: sale.employee,
        employeeId: saleDetail.empno || '',
        date: saleDetail.salesdate,
        items,
        totalAmount: items.reduce((total, item) => total + item.amount, 0)
      });
      
      setIsEditSaleDialogOpen(true);
    } catch (error) {
      console.error('Error in handleEditSale:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching sale details",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        const { error: deleteDetailError } = await supabase
          .from('salesdetail')
          .delete()
          .eq('transno', id);

        if (deleteDetailError) throw deleteDetailError;

        const { error: deleteSaleError } = await supabase
          .from('sales')
          .delete()
          .eq('transno', id);

        if (deleteSaleError) throw deleteSaleError;

        setSalesData(prev => prev.filter(sale => sale.id !== id));
        
        toast({
          title: "Sale deleted",
          description: "The sale has been deleted successfully"
        });
      } catch (error) {
        console.error('Error deleting sale:', error);
        toast({
          title: "Error",
          description: "Failed to delete sale. Please try again.",
          variant: "destructive"
        });
      }
    }
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
    setShowCustomerDropdown(false);
    setShowEmployeeDropdown(false);
    setShowProductDropdown(false);
    setEditingItemIndex(null);
  };
  
  const handleEditSaleClose = () => {
    setIsEditSaleDialogOpen(false);
    setEditSale({
      id: "",
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
    setShowCustomerDropdown(false);
    setShowEmployeeDropdown(false);
    setShowProductDropdown(false);
    setEditingItemIndex(null);
    setCurrentEditingSale(null);
  };
  
  const handleUpdateSale = async () => {
    if (!editSale.customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive"
      });
      return;
    }
    
    if (!editSale.employeeId) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive"
      });
      return;
    }
    
    if (editSale.items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive"
      });
      return;
    }

    try {
      setSavingOrder(true);
      
      const { error: updateSaleError } = await supabase
        .from('sales')
        .update({
          custno: editSale.customerId,
          empno: editSale.employeeId,
          salesdate: editSale.date
        })
        .eq('transno', editSale.id);
      
      if (updateSaleError) {
        throw new Error(`Error updating sale: ${updateSaleError.message}`);
      }
      
      const { error: deleteSaleDetailsError } = await supabase
        .from('salesdetail')
        .delete()
        .eq('transno', editSale.id);
      
      if (deleteSaleDetailsError) {
        throw new Error(`Error removing existing details: ${deleteSaleDetailsError.message}`);
      }
      
      for (const item of editSale.items) {
        const { error: detailError } = await supabase
          .from('salesdetail')
          .insert({
            transno: editSale.id,
            prodcode: item.productId,
            quantity: item.quantity
          });
          
        if (detailError) {
          throw new Error(`Error adding product: ${detailError.message}`);
        }
      }
      
      setSalesData(prev => {
        const updatedSales = prev.filter(sale => sale.id !== editSale.id);
        const updatedSale = {
          id: editSale.id,
          saleNumber: editSale.id,
          date: editSale.date,
          customer: editSale.customer,
          employee: editSale.employee,
          products: editSale.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currentPrice: item.currentPrice,
            amount: item.quantity * item.currentPrice
          })),
          totalAmount: editSale.totalAmount
        };
        
        return [updatedSale, ...updatedSales].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });
      
      toast({
        title: "Sale updated",
        description: `Sale ${editSale.id} has been updated successfully`,
      });
      
      handleEditSaleClose();
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update sale. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingOrder(false);
    }
  };
  
  const handleNewSaleSubmit = async () => {
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

    try {
      setSavingOrder(true);
      
      const { data: latestSale, error: fetchError } = await supabase
        .from('sales')
        .select('transno')
        .order('transno', { ascending: false })
        .limit(1);

      if (fetchError) {
        throw new Error(`Error fetching latest sale: ${fetchError.message}`);
      }

      let nextTransNo = 'TR00001';
      if (latestSale && latestSale.length > 0) {
        const lastNumber = parseInt(latestSale[0].transno.replace('TR', ''));
        nextTransNo = `TR${String(lastNumber + 1).padStart(5, '0')}`;
      }
      
      const { error: salesError } = await supabase
        .from('sales')
        .insert({
          transno: nextTransNo,
          custno: newSale.customerId,
          empno: newSale.employeeId,
          salesdate: newSale.date
        });
        
      if (salesError) {
        console.error('Error creating sale record:', salesError);
        throw new Error(`Error creating sale: ${salesError.message}`);
      }
      
      console.log("Sale created successfully:", nextTransNo);
      
      for (const item of newSale.items) {
        console.log("Adding product:", item.productId, "quantity:", item.quantity);
        
        const { error: detailError } = await supabase
          .from('salesdetail')
          .insert({
            transno: nextTransNo,
            prodcode: item.productId,
            quantity: item.quantity
          });
          
        if (detailError) {
          console.error('Error creating sale detail:', detailError);
          throw new Error(`Error adding product: ${detailError.message}`);
        }
      }
      
      console.log("All sale details added successfully");
      
      toast({
        title: "Sale created",
        description: `New sale created with number ${nextTransNo}`,
      });

      const newSaleItem: SaleWithDetails = {
        id: nextTransNo,
        saleNumber: nextTransNo,
        date: newSale.date,
        customer: newSale.customer,
        employee: newSale.employee,
        products: newSale.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          currentPrice: item.currentPrice,
          amount: item.quantity * item.currentPrice
        })),
        totalAmount: newSale.totalAmount
      };
      
      // Add to beginning of array and re-sort by TR number ascending
      setSalesData(prev => {
        const newArray = [newSaleItem, ...prev];
        return newArray.sort((a, b) => {
          const aNum = parseInt(a.saleNumber.replace('TR', ''), 10) || 0;
          const bNum = parseInt(b.saleNumber.replace('TR', ''), 10) || 0;
          return aNum - bNum;
        });
      });
      
      handleNewSaleClose();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create sale. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingOrder(false);
    }
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
          <div className="relative w-full" style={{ maxHeight: 600, overflowY: 'auto' }}>
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-background shadow-md">
                <TableRow>
                  <TableHead className="bg-background">Sales No</TableHead>
                  <TableHead className="bg-background">Date</TableHead>
                  <TableHead className="bg-background">Customer</TableHead>
                  <TableHead className="bg-background">Employee</TableHead>
                  <TableHead className="bg-background">Product</TableHead>
                  <TableHead className="bg-background">Quantity</TableHead>
                  <TableHead className="bg-background">Unit Price</TableHead>
                  <TableHead className="bg-background">Current Price</TableHead>
                  <TableHead className="bg-background">Amount</TableHead>
                  <TableHead className="bg-background w-[100px]"></TableHead>
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
                  <React.Fragment key={sale.id}>
                    {sale.products.map((product, idx) => (
                      <TableRow key={`${sale.id}-${idx}`}>
                        {idx === 0 ? (
                          <>
                            <TableCell>{sale.saleNumber}</TableCell>
                            <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                            <TableCell>{sale.customer}</TableCell>
                            <TableCell>{sale.employee}</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                          </>
                        )}
                        <TableCell>{product.product}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{formatCurrency(product.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(product.currentPrice)}</TableCell>
                        <TableCell>{formatCurrency(product.amount)}</TableCell>
                        {idx === 0 ? (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditSale(sale.id)}
                              >
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteSale(sale.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        ) : (
                          <TableCell></TableCell>
                        )}
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={8} className="text-right font-bold">
                        Total Amount:
                      </TableCell>
                      <TableCell colSpan={2} className="font-bold">
                        {formatCurrency(sale.totalAmount)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
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
            <div></div>
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
            <div className="space-y-2 relative">
              <Label htmlFor="customer">Customer</Label>
              <Input 
                placeholder={newSale.customer || "Search customers..."}
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onClick={() => setShowCustomerDropdown(true)}
              />
              {showCustomerDropdown && customerSearch && (
                <div className="absolute z-50 w-full bg-white border rounded-md shadow-md mt-1 max-h-56 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No customers found</div>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <div 
                        key={customer.custno} 
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => {
                          setNewSale({
                            ...newSale, 
                            customer: customer.custname || '',
                            customerId: customer.custno
                          });
                          setCustomerSearch('');
                          setShowCustomerDropdown(false);
                        }}
                      >
                        {customer.custname}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="employee">Employee</Label>
              <Input 
                placeholder={newSale.employee || "Search employees..."}
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setShowEmployeeDropdown(true);
                }}
                onClick={() => setShowEmployeeDropdown(true)}
              />
              {showEmployeeDropdown && employeeSearch && (
                <div className="absolute z-50 w-full bg-white border rounded-md shadow-md mt-1 max-h-56 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No employees found</div>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <div 
                        key={employee.empno} 
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => {
                          setNewSale({
                            ...newSale, 
                            employee: `${employee.firstname} ${employee.lastname}`,
                            employeeId: employee.empno
                          });
                          setEmployeeSearch('');
                          setShowEmployeeDropdown(false);
                        }}
                      >
                        {`${employee.firstname} ${employee.lastname}`}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2 relative">
                <Label htmlFor="product">Product</Label>
                <Input 
                  placeholder={currentProductItem.product || "Search products..."}
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onClick={() => setShowProductDropdown(true)}
                />
                {showProductDropdown && productSearch && (
                  <div className="absolute z-50 w-full bg-white border rounded-md shadow-md mt-1 max-h-56 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No products found</div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div
                          key={product.prodcode}
                          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleProductSelect(product.prodcode)}
                        >
                          {product.description}
                        </div>
                      ))
                    )}
                  </div>
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
              
              {editingItemIndex !== null ? (
                <Button onClick={() => handleSaveEdit(editingItemIndex)}>
                  <Save className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleAddProductToSale} disabled={!currentProductItem.productId}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              )}
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
                      <TableHead className="w-20"></TableHead>
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
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditItem(index)}
                              disabled={editingItemIndex !== null}
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
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
            <Button variant="outline" onClick={handleNewSaleClose} disabled={savingOrder}>Cancel</Button>
            <Button onClick={handleNewSaleSubmit} disabled={savingOrder}>
              {savingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Sale'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditSaleDialogOpen} onOpenChange={setIsEditSaleDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Sale {editSale.id}</DialogTitle>
            <DialogDescription>
              Update the details for this sale.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-between items-center">
            <div></div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="edit-date">Date:</Label>
              <Input
                id="edit-date"
                type="date"
                value={editSale.date}
                onChange={(e) => setEditSale({...editSale, date: e.target.value})}
                className="w-40"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 relative">
              <Label htmlFor="edit-customer">Customer</Label>
              <Input 
                placeholder={editSale.customer || "Search customers..."}
                value={customerSearch || editSale.customer}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onClick={() => setShowCustomerDropdown(true)}
              />
              {showCustomerDropdown && customerSearch && (
                <div className="absolute z-50 w-full bg-white border rounded-md shadow-md mt-1 max-h-56 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No customers found</div>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <div 
                        key={customer.custno} 
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => {
                          setEditSale({
                            ...editSale, 
                            customer: customer.custname || '',
                            customerId: customer.custno
                          });
                          setCustomerSearch('');
                          setShowCustomerDropdown(false);
                        }}
                      >
                        {customer.custname}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="edit-employee">Employee</Label>
              <Input 
                placeholder={editSale.employee || "Search employees..."}
                value={employeeSearch || editSale.employee}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setShowEmployeeDropdown(true);
                }}
                onClick={() => setShowEmployeeDropdown(true)}
              />
              {showEmployeeDropdown && employeeSearch && (
                <div className="absolute z-50 w-full bg-white border rounded-md shadow-md mt-1 max-h-56 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No employees found</div>
                  ) : (
                    filteredEmployees.map((employee) => (
                      <div 
                        key={employee.empno} 
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => {
                          setEditSale({
                            ...editSale, 
                            employee: `${employee.firstname} ${employee.lastname}`,
                            employeeId: employee.empno
                          });
                          setEmployeeSearch('');
                          setShowEmployeeDropdown(false);
                        }}
                      >
                        {`${employee.firstname} ${employee.lastname}`}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2 relative">
                <Label htmlFor="edit-product">Product</Label>
                <Input 
                  placeholder={currentProductItem.product || "Search products..."}
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onClick={() => setShowProductDropdown(true)}
                />
                {showProductDropdown && productSearch && (
                  <div className="absolute z-50 w-full bg-white border rounded-md shadow-md mt-1 max-h-56 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">No products found</div>
                    ) : (
                      filteredProducts.map((product) => (
                        <div
                          key={product.prodcode}
                          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleProductSelect(product.prodcode)}
                        >
                          {product.description}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <div className="w-24 space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={currentProductItem.quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                />
              </div>
              
              <div className="w-32 space-y-2">
                <Label htmlFor="edit-unit-price">Unit Price</Label>
                <Input
                  id="edit-unit-price"
                  value={formatCurrency(currentProductItem.unitPrice)}
                  disabled
                />
              </div>
              
              <div className="w-32 space-y-2">
                <Label htmlFor="edit-current-price">Current Price</Label>
                <Input
                  id="edit-current-price"
                  value={formatCurrency(currentProductItem.currentPrice)}
                  disabled
                />
              </div>
              
              {editingItemIndex !== null ? (
                <Button onClick={() => handleSaveEdit(editingItemIndex)}>
                  <Save className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleAddProductToSale} disabled={!currentProductItem.productId}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="border rounded p-2">
              <div className="font-bold mb-2">Cart Items</div>
              {editSale.items.length === 0 ? (
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
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editSale.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.currentPrice)}</TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditItem(index)}
                              disabled={editingItemIndex !== null}
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
                      <TableCell colSpan={2} className="font-bold">{formatCurrency(editSale.totalAmount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleEditSaleClose} disabled={savingOrder}>Cancel</Button>
            <Button onClick={handleUpdateSale} disabled={savingOrder}>
              {savingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
