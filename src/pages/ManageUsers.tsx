
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Shield, Ban, ShieldCheck, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

// Define types
type UserPermissions = {
  editSales: boolean;
  addSale: boolean;
  deleteSale: boolean;
  editSalesDetail: boolean;
  addSalesDetail: boolean;
  deleteSalesDetail: boolean;
  viewEmployees: boolean;
  editEmployees: boolean;
};

// Default permissions
const DEFAULT_PERMISSIONS: UserPermissions = {
  editSales: false,
  addSale: false,
  deleteSale: false,
  editSalesDetail: false,
  addSalesDetail: false,
  deleteSalesDetail: false,
  viewEmployees: true,
  editEmployees: false
};

// Admin email
const ADMIN_EMAIL = "alliahalexis.cinco@neu.edu.ph";

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  permissions: UserPermissions;
  index: number;
  email?: string;
  isBlocked?: boolean;
}

const ManageUsers: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);

  // Fetch users from Supabase Edge Function
  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          
          // First check if user has admin email
          const isCurrentUserAdmin = user.email === ADMIN_EMAIL;
          
          if (!isCurrentUserAdmin) {
            // If not default admin email, check if they are an admin in the profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', user.id)
              .single();
              
            if (profileData && profileData.is_admin) {
              setIsAdmin(true);
            } else {
              toast({
                title: "Access Denied",
                description: "Only administrators can view this page.",
                variant: "destructive",
              });
              return;
            }
          } else {
            setIsAdmin(true);
          }

          // Get current session for the token
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            toast({
              title: "Authentication Required",
              description: "Please log in to access this page.",
              variant: "destructive",
            });
            return;
          }
          
          // Call the edge function to get users with admin privileges
          const response = await fetch(
            'https://unixmerhujdxfsikiekp.supabase.co/functions/v1/list-users',
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch users');
          }
          
          const authUsers = await response.json();
          
          // Get all user permissions
          const { data: permissions } = await supabase
            .from('user_permissions')
            .select('*');

          // Process users
          const processedUsers: User[] = [];
          let index = 1;
          
          for (const authUser of authUsers) {
            // Find user permissions if available
            const userPermission = permissions?.find(p => p.user_id === authUser.id);
            // Get permissions from profile or set defaults
            const permissionsFromProfile = authUser.profile?.permissions as UserPermissions || DEFAULT_PERMISSIONS;
            
            processedUsers.push({
              id: authUser.id,
              username: authUser.username,
              isAdmin: authUser.isAdmin,
              permissions: permissionsFromProfile,
              index: index++,
              email: authUser.email,
              isBlocked: userPermission?.isBlocked || false
            });
          }
          
          setUsers(processedUsers);
        }
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: `Failed to load users: ${error.message || "Unknown error"}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, [toast]);

  // Function to update user permissions - using Edge Function to bypass RLS
  const updatePermission = async (userId: string, permission: keyof UserPermissions, value: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can update permissions.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the user to update
      const userToUpdate = users.find(user => user.id === userId);
      if (!userToUpdate) {
        toast({
          title: "Error",
          description: "User not found.",
          variant: "destructive",
        });
        return;
      }

      // Create updated permissions
      const updatedPermissions = {
        ...userToUpdate.permissions,
        [permission]: value
      };
      
      // Get current session for the token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session found");
      }
      
      // Call the edge function to update profile permissions
      const response = await fetch(
        'https://unixmerhujdxfsikiekp.supabase.co/functions/v1/update-profile-permissions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            permissions: updatedPermissions
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update permissions');
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, permissions: updatedPermissions } 
            : user
        )
      );

      toast({
        title: "Permission Updated",
        description: `Permission updated successfully for ${userToUpdate.username}`,
      });
    } catch (error: any) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: `Failed to update permission: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  // Function to update user type (admin/user)
  const updateUserType = async (userId: string, isAdminValue: boolean) => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can update user types.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the user to update
      const userToUpdate = users.find(user => user.id === userId);
      if (!userToUpdate) {
        toast({
          title: "Error",
          description: "User not found.",
          variant: "destructive",
        });
        return;
      }

      // Get current session for the token to use service role 
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session found");
      }

      // Call the edge function to update user type
      const response = await fetch(
        'https://unixmerhujdxfsikiekp.supabase.co/functions/v1/update-profile-permissions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            is_admin: isAdminValue
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user type');
      }
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isAdmin: isAdminValue } 
            : user
        )
      );
      
      toast({
        title: "User Role Updated",
        description: `User ${userToUpdate.username} is now ${isAdminValue ? 'an Admin' : 'a User'}`,
      });
    } catch (error: any) {
      console.error('Error updating user type:', error);
      toast({
        title: "Error",
        description: `Failed to update user type: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  // Function to toggle user blocked status
  const toggleBlockUser = async (confirm = false) => {
    if (!userToBlock) return;
    
    if (!confirm) {
      setBlockDialogOpen(true);
      return;
    }
    
    setBlockDialogOpen(false);
    
    if (!isAdmin || userToBlock.id === currentUserId) {
      toast({
        title: "Permission Denied",
        description: "You cannot block yourself or you don't have admin rights.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current session for the token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session found");
      }

      const newBlockedStatus = !userToBlock.isBlocked;
      
      // Call the edge function to update block status
      const response = await fetch(
        'https://unixmerhujdxfsikiekp.supabase.co/functions/v1/update-profile-permissions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userToBlock.id,
            isBlocked: newBlockedStatus
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update block status');
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userToBlock.id 
            ? { ...user, isBlocked: newBlockedStatus } 
            : user
        )
      );
      
      toast({
        title: newBlockedStatus ? "User Blocked" : "User Unblocked",
        description: `${userToBlock.username} has been ${newBlockedStatus ? 'blocked' : 'unblocked'}`
      });
      
      setUserToBlock(null);
    } catch (error: any) {
      console.error('Error updating block status:', error);
      toast({
        title: "Error",
        description: `Failed to update block status: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  // Helper function to get user initials for avatar
  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Reordered display columns as shown in the image
  const displayColumns = [
    "editSales", 
    "deleteSale", 
    "addSale",
    "editSalesDetail", 
    "deleteSalesDetail", 
    "addSalesDetail"
  ];
  
  const permissionsLabels: Record<keyof UserPermissions, string> = {
    editSales: "Edit Sales",
    addSale: "Add Sale",
    deleteSale: "Delete Sale",
    editSalesDetail: "Edit Sales Detail", 
    addSalesDetail: "Add Sales Detail",
    deleteSalesDetail: "Delete Sales Detail",
    viewEmployees: "View Employees",
    editEmployees: "Edit Employees"
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Manage Users</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Permissions</CardTitle>
          <CardDescription>
            Manage user access rights and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAdmin && (
            <div className="mb-4 p-4 bg-yellow-50 text-yellow-800 rounded-md flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              You need administrator privileges to manage user permissions.
            </div>
          )}
          
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="bg-background sticky top-0 z-20">User ID</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Username</TableHead>
                  {displayColumns.map(key => (
                    <TableHead key={key} className="bg-background sticky top-0 z-20">
                      {permissionsLabels[key as keyof typeof permissionsLabels]}
                    </TableHead>
                  ))}
                  <TableHead className="bg-background sticky top-0 z-20">Role</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className={user.isBlocked ? "bg-gray-50" : ""}>
                      <TableCell>{user.index}</TableCell>
                      <TableCell className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getUserInitials(user.username)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{user.username}</div>
                      </TableCell>
                      {displayColumns.map(key => (
                        <TableCell key={`${user.id}-${key}`}>
                          {isAdmin ? (
                            <Toggle
                              pressed={user.permissions[key as keyof UserPermissions] || false}
                              onPressedChange={(checked) => updatePermission(user.id, key as keyof UserPermissions, checked)}
                              disabled={user.isBlocked}
                              className="w-[80px] justify-center"
                              variant="outline"
                            >
                              {user.permissions[key as keyof UserPermissions] ? (
                                <div className="flex items-center text-blue-500 font-medium">
                                  <ToggleRight className="h-4 w-4 mr-1" />
                                  TRUE
                                </div>
                              ) : (
                                <div className="flex items-center text-gray-500 font-medium">
                                  <ToggleLeft className="h-4 w-4 mr-1" />
                                  FALSE
                                </div>
                              )}
                            </Toggle>
                          ) : (
                            <div 
                              className={`px-3 py-2 rounded flex items-center justify-center w-[80px] font-medium
                                ${user.permissions[key as keyof UserPermissions] 
                                  ? 'text-blue-500' 
                                  : 'text-gray-500'}`}
                            >
                              {user.permissions[key as keyof UserPermissions] ? (
                                <>
                                  <ToggleRight className="h-4 w-4 mr-1" />
                                  TRUE
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4 mr-1" />
                                  FALSE
                                </>
                              )}
                            </div>
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        {isAdmin ? (
                          <Select
                            value={user.isAdmin ? 'admin' : 'user'}
                            onValueChange={(value) => updateUserType(user.id, value === 'admin')}
                            disabled={user.id === currentUserId || user.isBlocked}
                          >
                            <SelectTrigger className={`w-24 ${user.isAdmin ? 'bg-blue-500 text-white border-blue-500' : ''}`}>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={user.isAdmin ? 'default' : 'outline'} className={user.isAdmin ? 'bg-blue-500' : ''}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={user.isBlocked ? "border-red-500 text-red-500 hover:bg-red-50" : "hover:bg-blue-50"}
                          onClick={() => {
                            setUserToBlock(user);
                            toggleBlockUser(false);
                          }}
                          disabled={!isAdmin || user.id === currentUserId}
                        >
                          {user.isBlocked ? (
                            <>
                              <ShieldCheck className="h-4 w-4 mr-1" />
                              Unblock
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4 mr-1" />
                              Block
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Block User Confirmation Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToBlock?.isBlocked 
                ? `Unblock ${userToBlock?.username}?` 
                : `Block ${userToBlock?.username}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToBlock?.isBlocked 
                ? "This user will regain access to the system." 
                : "This user will no longer be able to access the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToBlock(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => toggleBlockUser(true)}
              className={userToBlock?.isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {userToBlock?.isBlocked ? "Unblock" : "Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageUsers;
