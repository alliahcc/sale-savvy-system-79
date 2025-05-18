
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
import { supabase, EnhancedProfile, UserPermissions } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Update the UserProfile interface to include permissions
interface UserProfile {
  avatar_url: string | null;
  created_at: string;
  full_name: string | null;
  id: string;
  updated_at: string;
  permissions?: UserPermissions;
  email?: string;
}

interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  permissions: UserPermissions;
  index: number; // Add index for sequential numbering
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  editSales: false,
  editSalesDetail: false,
  addSale: false,
  addSalesDetail: false,
  deleteSale: false,
  deleteSalesDetail: false,
  viewEmployees: true,
  editEmployees: false
};

const ManageUsers: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch users from Supabase
  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          
          // Check if current user is admin (the specified email)
          const isCurrentUserAdmin = user.email === "alliahalexis.cinco@neu.edu.ph";
          setIsAdmin(isCurrentUserAdmin);
          
          // Fetch all auth users
          const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
          
          if (authError || !authData) {
            console.error("Error fetching auth users:", authError);
            
            // Fallback to profiles if admin API not available
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('*');
            
            if (profilesError) {
              throw profilesError;
            }
            
            if (profilesData && profilesData.length > 0) {
              // Map profiles to users
              const mappedProfiles = await Promise.all(profilesData.map(async (profile: any, index: number) => {
                const isCurrentUser = profile.id === currentUserId;
                
                // Try to get email from auth if this is current user
                let email = profile.email;
                if (isCurrentUser) {
                  email = user.email || profile.id;
                }
                
                // Ensure permissions exist with defaults
                const permissions = profile.permissions || DEFAULT_PERMISSIONS;
                
                return {
                  id: profile.id,
                  email: email || profile.id,
                  username: profile.full_name || 'User',
                  isAdmin: isCurrentUser && user.email === "alliahalexis.cinco@neu.edu.ph",
                  permissions: permissions,
                  index: index + 1
                };
              }));
              
              setUsers(mappedProfiles);
            }
          } else {
            // We have auth users data, now fetch their profiles
            const userIds = authData.users.map((authUser: any) => authUser.id);
            
            // Fetch all profiles
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', userIds);
              
            // Create a map for faster lookups
            const profilesMap = new Map();
            if (profilesData) {
              profilesData.forEach((profile: EnhancedProfile) => {
                profilesMap.set(profile.id, profile);
              });
            }
            
            // Combine auth and profiles data
            const mappedUsers = authData.users.map((authUser: any, index: number) => {
              const profile = profilesMap.get(authUser.id) as EnhancedProfile | undefined;
              
              // Use defaults if no permissions found
              const permissions = profile?.permissions || DEFAULT_PERMISSIONS;
              
              return {
                id: authUser.id,
                email: authUser.email || 'No email',
                username: profile?.full_name || authUser.user_metadata?.full_name || 'User',
                isAdmin: authUser.email === "alliahalexis.cinco@neu.edu.ph",
                permissions: permissions,
                index: index + 1 // 1-based indexing
              };
            });
            
            setUsers(mappedUsers);
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, [toast]);

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
      if (!userToUpdate) return;

      // Create updated permissions
      const updatedPermissions = {
        ...userToUpdate.permissions,
        [permission]: value
      };
      
      console.log("Updating permissions for user:", userId, permission, value);
      console.log("Updated permissions object:", updatedPermissions);

      // Update the permissions in Supabase
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
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      if (!userToUpdate) return;

      // Update local state first for immediate UI feedback
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, isAdmin: isAdminValue } 
            : user
        )
      );
      
      // Store the admin status in user metadata
      // Note: In a real system, you might need to update this through an admin API,
      // but for this demo we'll just update the local state and show a toast
      toast({
        title: "User Type Updated",
        description: `User ${userToUpdate.username} is now a ${isAdminValue ? 'Admin' : 'User'}`,
      });
    } catch (error) {
      console.error('Error updating user type:', error);
      toast({
        title: "Error",
        description: "Failed to update user type. Please try again.",
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

  // Reordered display columns
  const displayColumns = [
    "editSales", 
    "addSale", 
    "deleteSale",
    "editSalesDetail", 
    "addSalesDetail", 
    "deleteSalesDetail"
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
                  <TableHead className="bg-background sticky top-0 z-20">Email</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Username</TableHead>
                  {displayColumns.map(key => (
                    <TableHead key={key} className="bg-background sticky top-0 z-20">
                      {permissionsLabels[key as keyof typeof permissionsLabels]}
                    </TableHead>
                  ))}
                  <TableHead className="bg-background sticky top-0 z-20">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.index}</TableCell>
                      <TableCell>{user.email}</TableCell>
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
