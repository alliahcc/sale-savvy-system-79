
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

const ManageUsers: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch users from Supabase Edge Function
  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          
          // Check if current user is admin
          const isCurrentUserAdmin = user.email === ADMIN_EMAIL;
          setIsAdmin(isCurrentUserAdmin);
          
          if (!isCurrentUserAdmin) {
            toast({
              title: "Access Denied",
              description: "Only administrators can view this page.",
              variant: "destructive",
            });
            return;
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
          
          // Process users
          const processedUsers: User[] = [];
          let index = 1;
          
          for (const authUser of authUsers) {
            // Get permissions from profile or set defaults
            const permissions = authUser.profile?.permissions as UserPermissions || DEFAULT_PERMISSIONS;
            
            processedUsers.push({
              id: authUser.id,
              username: authUser.username,
              isAdmin: authUser.isAdmin,
              permissions: permissions,
              index: index++
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

  // Function to update user permissions
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
      console.log("Updating permission:", userId, permission, value);
      
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
      
      console.log("Updated permissions object:", updatedPermissions);

      // Check if profile exists before updating
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (checkError) {
        console.log("Profile doesn't exist, creating one");
        // Profile doesn't exist, create it
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            permissions: updatedPermissions,
            full_name: userToUpdate.username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
      } else {
        console.log("Profile exists, updating it");
        // Profile exists, update it
        const { error } = await supabase
          .from('profiles')
          .update({
            permissions: updatedPermissions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Error updating permission:', error);
          throw error;
        }
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

      // We can't actually change the admin status in the database since this requires
      // changing the email, but we can store the designation in the profile
      const { error } = await supabase
        .from('profiles')
        .update({
          is_admin: isAdminValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user type:', error);
        throw error;
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
        title: "User Type Updated",
        description: `User ${userToUpdate.username} is now shown as a ${isAdminValue ? 'Admin' : 'User'}`,
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

  // Helper function to get user initials for avatar
  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Component for permission toggle dropdown
  const PermissionToggle = ({ userId, permission, value }: { userId: string, permission: keyof UserPermissions, value: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-24 justify-between">
          {value ? 'True' : 'False'}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => updatePermission(userId, permission, true)}>
          True
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updatePermission(userId, permission, false)}>
          False
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

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
                    <TableRow key={user.id}>
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
                            <PermissionToggle 
                              userId={user.id} 
                              permission={key as keyof UserPermissions} 
                              value={user.permissions[key as keyof UserPermissions] || false} 
                            />
                          ) : (
                            <div className="px-3 py-2 border rounded">
                              {user.permissions[key as keyof UserPermissions] ? 'True' : 'False'}
                            </div>
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        {isAdmin ? (
                          <Select
                            value={user.isAdmin ? 'admin' : 'user'}
                            onValueChange={(value) => updateUserType(user.id, value === 'admin')}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className={`text-xs px-2 py-1 rounded-full inline-block ${user.isAdmin ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700'}`}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={user.permissions.editEmployees === false ? "opacity-50" : ""}
                          disabled={!isAdmin || user.email === ADMIN_EMAIL}
                        >
                          {user.permissions.editEmployees === false ? "Block" : "Block"}
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
    </div>
  );
};

export default ManageUsers;
