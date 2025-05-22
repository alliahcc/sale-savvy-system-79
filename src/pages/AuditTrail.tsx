
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

// Storage key for localStorage
const AUDIT_STORAGE_KEY = 'sales_audit_records';

// Create a global store for audit records that can be accessed across components
// This will be used by the Sales component to add records when actions are performed
export const auditStore = {
  records: [] as AuditRecord[],
  addRecord: function(record: AuditRecord) {
    this.records = [record, ...this.records];
    // Save to localStorage each time a record is added
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.records));
    // Trigger any listeners that have been registered
    this.listeners.forEach(listener => listener(this.records));
  },
  listeners: [] as ((records: AuditRecord[]) => void)[],
  subscribe: function(listener: (records: AuditRecord[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  // Initialize records from localStorage on module load
  init: function() {
    try {
      const storedRecords = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (storedRecords) {
        this.records = JSON.parse(storedRecords);
      }
    } catch (error) {
      console.error('Failed to load audit records from localStorage:', error);
    }
  }
};

// Initialize records from localStorage
auditStore.init();

const AuditTrail: React.FC = () => {
  const { toast } = useToast();
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
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
          .select('full_name, is_admin')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          if (profile.full_name) {
            setCurrentUser(profile.full_name);
          }
          // Set admin status
          setIsAdmin(profile.is_admin || false);
        }
        
        // Check if user has default admin email
        if (user.email === "alliahalexis.cinco@neu.edu.ph") {
          setIsAdmin(true);
        }
      } catch (error: any) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: `Failed to load user data: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserData();
    
    // Subscribe to audit store changes
    const unsubscribe = auditStore.subscribe((records) => {
      setAuditRecords(records);
    });
    
    // Set initial records
    setAuditRecords(auditStore.records);
    
    return () => {
      unsubscribe();
    };
  }, [toast]);
  
  // Get badge color based on action
  const getBadgeVariant = (action: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (action) {
      case 'ADDED':
        return 'secondary'; // Green for ADDED
      case 'EDITED':
        return 'default'; // Blue for EDITED (default is blue in our theme)
      case 'DELETED':
        return 'destructive'; // Red for DELETED
      default:
        return 'outline';
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
