
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
import { 
  supabase, 
  EnhancedProfile, 
  UserPermissions, 
  ADMIN_EMAIL,
  DEFAULT_PERMISSIONS 
} from "@/integrations/supabase/client";
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
  index: number;
}

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
          
          // Check if current user is admin
          setIsAdmin(user.email === ADMIN_EMAIL);
          
          // Fetch all auth users
          const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
          
          if (authError || !authData) {
            console.error("Error fetching auth users:", authError);
            throw new Error("Failed to fetch users: " + (authError?.message || "Unknown error"));
          }
          
          // Get all profiles for these users
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*');
          
          // Create a map of profiles by ID for faster lookups
          const profilesMap = new Map();
          if (profilesData) {
            profilesData.forEach((profile: EnhancedProfile) => {
              profilesMap.set(profile.id, profile);
            });
          }
          
          // Map auth users to our format
          const mappedUsers = authData.users.map((authUser: any, index: number) => {
            const profile = profilesMap.get(authUser.id) as EnhancedProfile | undefined;
            
            // Use email from auth user
            const email = authUser.email || 'No email';
            
            // Determine if user is admin
            const userIsAdmin = email === ADMIN_EMAIL;
            
            // Use existing permissions if available, or set defaults
            const permissions = profile?.permissions || DEFAULT_PERMISSIONS;
            
            return {
              id: authUser.id,
              email: email,
              username: profile?.full_name || authUser.user_metadata?.full_name || 'User',
              isAdmin: userIsAdmin,
              permissions: permissions,
              index: index + 1 // 1-based indexing for User ID
            };
          });
          
          setUsers(mappedUsers);
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
      
      console.log("Updating permissions for user:", userId, permission, value);
      console.log("Updated permissions object:", updatedPermissions);

      // Make sure the profile entry exists before updating
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (checkError) {
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
      // changing the email (in this implementation). But we can update the UI to show
      // the user as admin/user.
      
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

  // Reordered display columns as requested
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
