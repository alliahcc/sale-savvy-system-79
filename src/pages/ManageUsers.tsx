
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

interface UserPermissions {
  editSales: boolean;
  editSalesDetail: boolean;
  newSale: boolean;
  deleteSale: boolean;
  viewEmployees: boolean;
  editEmployees: boolean;
}

interface UserProfile {
  avatar_url: string | null;
  created_at: string;
  full_name: string | null;
  id: string;
  updated_at: string;
  permissions?: UserPermissions;
}

interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  permissions: UserPermissions;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  editSales: false,
  editSalesDetail: false,
  newSale: false,
  deleteSale: false,
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
          
          // Get all users directly from the auth.users view
          // This requires admin privileges in Supabase
          const { data: allUsers, error: usersError } = await supabase
            .from('users')
            .select('*');
            
          if (usersError) {
            console.error("Error fetching users:", usersError);
            throw usersError;
          }
          
          // Get profiles from profiles table
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*');
          
          if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            throw profilesError;
          }
          
          console.log("All users:", allUsers);
          console.log("All profiles:", profilesData);
          
          // Map users with their profiles and permissions
          if (allUsers && allUsers.length > 0) {
            const mappedUsers = allUsers.map(authUser => {
              const profile = profilesData?.find(p => p.id === authUser.id) as UserProfile | undefined;
              
              // Initialize permissions
              let permissions = DEFAULT_PERMISSIONS;
              
              // If profile exists and has permissions, use those
              if (profile && profile.permissions) {
                permissions = profile.permissions;
              }
              
              return {
                id: authUser.id,
                email: authUser.email || '',
                username: authUser.user_metadata?.full_name || 
                         authUser.email?.split('@')[0] || 
                         'Unknown',
                isAdmin: authUser.email === "alliahalexis.cinco@neu.edu.ph",
                permissions: permissions
              };
            });
            
            setUsers(mappedUsers);
          } else {
            // Fallback: If we can't access the users view directly,
            // let's try to get all users by fetching profiles
            const mappedProfiles = profilesData?.map(profile => {
              const email = profile.email || '';
              
              // Initialize permissions
              let permissions = DEFAULT_PERMISSIONS;
              if (profile.permissions) {
                permissions = profile.permissions;
              }
              
              return {
                id: profile.id,
                email: email,
                username: profile.full_name || email.split('@')[0] || 'Unknown',
                isAdmin: email === "alliahalexis.cinco@neu.edu.ph",
                permissions: permissions
              };
            }) || [];
            
            setUsers(mappedProfiles);
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

  const updatePermission = async (userId: string, permission: string, value: boolean) => {
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

      // First, check if the profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Update the permissions in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          permissions: updatedPermissions,
          updated_at: new Date().toISOString(),
          // Preserve existing data if it exists
          full_name: existingProfile?.full_name || userToUpdate.username,
          avatar_url: existingProfile?.avatar_url || null,
          created_at: existingProfile?.created_at || new Date().toISOString(),
        });

      if (error) {
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

  // Helper function to get user initials for avatar
  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const PermissionToggle = ({ userId, permission, value }: { userId: string, permission: string, value: boolean }) => (
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

  const permissionsLabels = {
    editSales: "Edit Sales",
    editSalesDetail: "Edit Sales Detail",
    newSale: "New Sale",
    deleteSale: "Delete Sale",
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
                  <TableHead className="bg-background sticky top-0 z-20">User</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Username</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Edit Sales</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Edit Sales Detail</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">New Sale</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Delete Sale</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">View Employees</TableHead>
                  <TableHead className="bg-background sticky top-0 z-20">Edit Employees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getUserInitials(user.username)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.email}</div>
                          {user.isAdmin && (
                            <div className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full inline-block mt-1">
                              Admin
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      {Object.entries(permissionsLabels).map(([key, label]) => (
                        <TableCell key={`${user.id}-${key}`}>
                          {isAdmin ? (
                            <PermissionToggle 
                              userId={user.id} 
                              permission={key} 
                              value={user.permissions[key as keyof typeof user.permissions]} 
                            />
                          ) : (
                            <div className="px-3 py-2 border rounded">
                              {user.permissions[key as keyof typeof user.permissions] ? 'True' : 'False'}
                            </div>
                          )}
                        </TableCell>
                      ))}
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
