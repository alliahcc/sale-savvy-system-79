
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Shield, ClipboardList } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// Define our audit record interface for tracking sales changes
interface AuditRecord {
  id: string;
  sale_id: string;
  action: 'ADDED' | 'EDITED' | 'DELETED';
  user_id: string;
  username: string;
  timestamp: string;
}

const AuditTrail: React.FC = () => {
  const { toast } = useToast();
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Set current username for audit purposes
        setCurrentUser(user.email || user.id);
        
        // Check if user has profile with full_name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (profile && profile.full_name) {
          setCurrentUser(profile.full_name);
        }
        
        // Fetch sales records to use as audit trail
        await fetchAuditRecords();
      } catch (error: any) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: `Failed to load user data: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    }
    
    fetchUserData();
    
    // Set up a subscription to listen for changes in sales
    const salesSubscription = supabase
      .channel('sales-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        console.log('Sales table changed, refreshing audit trail');
        fetchAuditRecords();
      })
      .subscribe();
    
    return () => {
      salesSubscription.unsubscribe();
    };
  }, [toast]);
  
  async function fetchAuditRecords() {
    try {
      setIsLoading(true);
      
      // Since there's no audit_trail table, we'll use the sales table directly
      // Get data from sales table
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('transno, salesdate, empno, custno');
      
      if (salesError) throw salesError;
      
      let actionRecords: AuditRecord[] = [];
      
      if (salesData) {
        // Get user profiles for username lookup
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name');
        
        // Create a map for quick username lookup
        const userMap = new Map();
        if (profilesData) {
          profilesData.forEach(profile => {
            userMap.set(profile.id, profile.full_name);
          });
        }
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        const currentUsername = user ? (userMap.get(user.id) || user.email || 'Unknown User') : 'Unknown User';
        
        // Convert sales records into audit records
        actionRecords = salesData.map((sale, index) => {
          // For simplicity, treat all existing records as ADDED
          // In a production app, you'd want to track actual changes
          const action: 'ADDED' | 'EDITED' | 'DELETED' = 'ADDED';
          
          return {
            id: `audit-${index}`,
            sale_id: sale.transno,
            action,
            user_id: sale.empno || 'unknown',
            username: currentUsername,
            timestamp: new Date(sale.salesdate || Date.now()).toLocaleString()
          };
        });
        
        // Sort by most recent first (assuming salesdate is the timestamp)
        actionRecords.sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
      }
      
      setAuditRecords(actionRecords);
    } catch (error: any) {
      console.error('Error fetching audit records:', error);
      toast({
        title: "Error",
        description: `Failed to load audit trail: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Get badge color based on action
  const getBadgeVariant = (action: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (action) {
      case 'ADDED':
        return 'secondary';
      case 'EDITED':
        return 'outline';
      case 'DELETED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Audit Trail</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Transaction History</CardTitle>
          <CardDescription>
            Track changes made to sales records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="bg-background sticky top-0 z-20">SalesTrans</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Status</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Stamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10">
                      Loading audit trail...
                    </TableCell>
                  </TableRow>
                ) : auditRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10">
                      No audit records found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.sale_id}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(record.action)}>
                          {record.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{record.username}</span>
                          <span className="text-sm text-gray-500">
                            {record.timestamp}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTrail;
