
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

// Define our audit record interface based on the database structure
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Set current username for audit purposes
        setCurrentUser(user.email || user.id);
        
        // Check if user is admin (default admin email or profile)
        const isDefaultAdmin = user.email === "alliahalexis.cinco@neu.edu.ph";
        
        if (!isDefaultAdmin) {
          // Check if user has admin flag in profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, full_name')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            if (profile.is_admin) {
              setIsAdmin(true);
            }
            // If full_name exists, use it instead of email
            if (profile.full_name) {
              setCurrentUser(profile.full_name);
            }
          }
        } else {
          setIsAdmin(true);
        }
        
        // Fetch audit records
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
      
      // Create a proper audit_trail table in Supabase if it doesn't exist yet
      // For this example, we'll query a view that combines sales data with actions
      
      // First, check if audit_trail table exists, if not we'll use sales table data
      const { data: auditTable, error: auditTableError } = await supabase
        .from('audit_trail')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (auditTableError && auditTableError.code !== 'PGRST116') {
        // If error is not "relation does not exist", it's a different error
        throw auditTableError;
      }
      
      let actionRecords: AuditRecord[] = [];
      
      // If audit_trail exists, use that table
      if (!auditTableError) {
        const { data, error } = await supabase
          .from('audit_trail')
          .select('id, sale_id, action, user_id, username, timestamp')
          .order('timestamp', { ascending: false });
        
        if (error) throw error;
        
        if (data) {
          actionRecords = data.map(record => ({
            id: record.id,
            sale_id: record.sale_id,
            action: record.action as 'ADDED' | 'EDITED' | 'DELETED',
            user_id: record.user_id,
            username: record.username,
            timestamp: record.timestamp
          }));
        }
      } else {
        // Get changes from sales and salesdetail tables
        // Get initial data from sales table
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('transno, created_at, updated_at')
          .order('updated_at', { ascending: false });
        
        if (salesError) throw salesError;
        
        if (salesData) {
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
          const currentUsername = userMap.get(user?.id) || user?.email || 'Unknown User';
          
          // Find deleted sales (would need to be tracked separately in a real app)
          // Here we're just using the sales table data
          
          // Extract actions from sales records based on timestamps
          let lastActionTime: Date | null = null;
          
          actionRecords = salesData.map((sale, index) => {
            const saleCreatedAt = new Date(sale.created_at);
            const saleUpdatedAt = new Date(sale.updated_at);
            
            // Determine if this was created or updated
            // In a real app, you'd have separate records for each action
            let action: 'ADDED' | 'EDITED' | 'DELETED' = 'ADDED';
            let timestamp = sale.created_at;
            
            if (Math.abs(saleCreatedAt.getTime() - saleUpdatedAt.getTime()) > 1000) {
              // If updated_at is more than 1 second after created_at, consider it edited
              action = 'EDITED';
              timestamp = sale.updated_at;
            }
            
            return {
              id: `audit-${index}`,
              sale_id: sale.transno,
              action,
              user_id: user?.id || 'unknown',
              username: currentUsername,
              timestamp: new Date(timestamp).toLocaleString()
            };
          });
        }
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

  // Render status with appropriate styling based on action
  const renderStatus = (action: string) => {
    switch (action) {
      case 'ADDED':
        return <span className="text-green-600 font-medium">{action}</span>;
      case 'EDITED':
        return <span className="text-blue-600 font-medium">{action}</span>;
      case 'DELETED':
        return <span className="text-red-600 font-medium">{action}</span>;
      default:
        return <span>{action}</span>;
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
