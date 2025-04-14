
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

type Product = {
  prodcode: string;
  description: string;
  unit: string;
  currentPrice?: number;
};

const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // First, get all products
        const { data: productsData, error: productsError } = await supabase
          .from('product')
          .select('*');
          
        if (productsError) throw new Error(productsError.message);
        
        if (!productsData) {
          setProducts([]);
          return;
        }
        
        // For each product, get the latest price from pricehist table
        const productsWithPrices = await Promise.all(
          productsData.map(async (product) => {
            // Get the latest price for this product
            const { data: priceData } = await supabase
              .from('pricehist')
              .select('unitprice, effdate')
              .eq('prodcode', product.prodcode)
              .order('effdate', { ascending: false })
              .limit(1);
              
            return {
              ...product,
              currentPrice: priceData && priceData.length > 0 ? priceData[0].unitprice : null
            };
          })
        );
        
        setProducts(productsWithPrices);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">Error loading products: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Catalog</CardTitle>
        <CardDescription>Current products and their prices</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Current Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">No products found</TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.prodcode}>
                  <TableCell className="font-medium">{product.prodcode}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>{formatCurrency(product.currentPrice)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProductList;
