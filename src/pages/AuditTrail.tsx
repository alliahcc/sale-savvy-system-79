
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

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Check if user is admin (default admin email or profile)
        const isDefaultAdmin = user.email === "alliahalexis.cinco@neu.edu.ph";
        
        if (!isDefaultAdmin) {
          // Check if user has admin flag in profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();
          
          if (profile && profile.is_admin) {
            setIsAdmin(true);
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
  }, [toast]);
  
  async function fetchAuditRecords() {
    try {
      setIsLoading(true);
      
      // Temporarily use a generic type and cast the result
      // Using 'sales_audit_log' instead of 'sales_audit'
      const { data, error } = await supabase
        .from('sales')  // Use an existing table as a placeholder
        .select('*')
        .order('salesdate', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        // In a real implementation, we would fetch actual audit records
        // For now, let's create mock audit data from sales records
        const mockAuditRecords: AuditRecord[] = data.map((sale: any, index: number) => ({
          id: `audit-${index}`,
          sale_id: sale.transno || `SALE-${index}`,
          action: ['ADDED', 'EDITED', 'DELETED'][Math.floor(Math.random() * 3)] as 'ADDED' | 'EDITED' | 'DELETED',
          user_id: 'mock-user-id',
          username: 'Mock User',
          timestamp: new Date().toISOString(),
        }));
        
        setAuditRecords(mockAuditRecords);
      }
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
  
  // Format timestamp to readable date and time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

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
                  <TableHead className="bg-background sticky top-0 z-20">Sales Trans. No</TableHead>
                  {isAdmin && (
                    <>
                      <TableHead className="bg-background sticky top-0 z-20">Status</TableHead>
                      <TableHead className="bg-background sticky top-0 z-20">Stamp</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 3 : 1} className="text-center py-10">
                      Loading audit trail...
                    </TableCell>
                  </TableRow>
                ) : auditRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 3 : 1} className="text-center py-10">
                      No audit records found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.sale_id}</TableCell>
                      {isAdmin && (
                        <>
                          <TableCell>
                            <Badge variant={getBadgeVariant(record.action)}>
                              {record.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{record.username}</span>
                              <span className="text-sm text-gray-500">
                                {formatTimestamp(record.timestamp)}
                              </span>
                            </div>
                          </TableCell>
                        </>
                      )}
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
