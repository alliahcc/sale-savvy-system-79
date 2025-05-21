
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
      const { data, error } = await supabase
        .from('sales')  // Use an existing table as a placeholder
        .select('*')
        .order('salesdate', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        // In a real implementation, we would fetch actual audit records
        // For now, create mock audit data that matches your image
        const mockAuditRecords: AuditRecord[] = [
          {
            id: 'audit-1',
            sale_id: 'TR0001',
            action: 'EDITED',
            user_id: 'user-1',
            username: 'Juan Dela Cruz',
            timestamp: '2025-05-08 13:00 PM'
          },
          {
            id: 'audit-2',
            sale_id: 'TR0002',
            action: 'DELETED',
            user_id: 'user-2',
            username: 'Jerry Esperanza',
            timestamp: '2025-05-08 11:33 AM'
          },
          {
            id: 'audit-3',
            sale_id: 'TR0003',
            action: 'ADDED',
            user_id: 'user-1',
            username: 'Juan Dela Cruz',
            timestamp: '2025-05-08 13:10 PM'
          },
        ];
        
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
                            {renderStatus(record.action)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{record.username}</span>
                              <span className="text-sm text-gray-500">
                                {record.timestamp}
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
