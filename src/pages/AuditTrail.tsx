
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
    
    // Set up a subscription to listen for changes in sales table
    const salesSubscription = supabase
      .channel('sales-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sales' }, 
        (payload) => {
          console.log('Sales record added:', payload);
          handleSalesChange(payload.new, 'ADDED');
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'sales' }, 
        (payload) => {
          console.log('Sales record updated:', payload);
          handleSalesChange(payload.new, 'EDITED');
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'sales' }, 
        (payload) => {
          console.log('Sales record deleted:', payload.old);
          handleSalesChange(payload.old, 'DELETED');
        }
      )
      .subscribe();
    
    return () => {
      salesSubscription.unsubscribe();
    };
  }, [toast]);
  
  // Function to handle sales changes in real-time
  const handleSalesChange = async (record: any, action: 'ADDED' | 'EDITED' | 'DELETED') => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      let username = user.email || user.id;
      
      // Check if user has profile with full_name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.full_name) {
        username = profile.full_name;
      }
      
      // Create new audit record
      const newAuditRecord: AuditRecord = {
        id: `${Date.now()}`,
        sale_id: record.transno,
        action: action,
        user_id: user.id,
        username: username,
        timestamp: new Date().toLocaleString()
      };
      
      // Update local state with the new record at the beginning of the array (newest first)
      setAuditRecords(prev => [newAuditRecord, ...prev]);
    } catch (error) {
      console.error('Error handling sales change:', error);
    }
  };
  
  async function fetchAuditRecords() {
    setIsLoading(true);
    // Initially, there should be no audit records until actions are performed
    setAuditRecords([]);
    setIsLoading(false);
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
