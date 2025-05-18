
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

// Update the UserProfile interface to include permissions
interface UserProfile {
  avatar_url: string | null;
  created_at: string;
  full_name: string | null;
  id: string;
  updated_at: string;
  permissions?: UserPermissions;
  email?: string; // Add email as optional
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
          
          // Fetch all users from Auth API
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
          
          if (authError) {
            console.error("Error fetching auth users:", authError);
            // If we can't fetch from admin API, fall back to profiles table
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('*');
            
            if (profilesError) {
              console.error("Error fetching profiles:", profilesError);
              throw profilesError;
            }
            
            // Map profiles to users
            if (profilesData && profilesData.length > 0) {
              const mappedUsers = profilesData.map((profile: EnhancedProfile, index: number) => {
                // For the current user, we know their email from auth
                const isCurrentUser = profile.id === currentUserId;
                
                // Extract permissions or use defaults
                const permissions = profile.permissions || DEFAULT_PERMISSIONS;
                
                // Determine if admin by email (for current user only, since we know their email)
                const isUserAdmin = isCurrentUser && user.email === "alliahalexis.cinco@neu.edu.ph";
                
                return {
                  id: profile.id,
                  // Use known email for current user, otherwise use placeholder or stored email
                  email: isCurrentUser ? user.email || profile.id : profile.email || profile.id,
                  username: profile.full_name || 'User',
                  isAdmin: isUserAdmin,
                  permissions: permissions,
                  index: index + 1 // Add 1-based indexing
                };
              });
              
              setUsers(mappedUsers);
            } else {
              // No profiles found
              toast({
                title: "No Users Found",
                description: "No user profiles exist in the database.",
                variant: "destructive",
              });
            }
          } else if (authUsers && authUsers.users) {
            // We got auth users, now let's get their profiles for additional data
            const userIds = authUsers.users.map(user => user.id);
            
            // Fetch profiles for these users
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', userIds);
              
            // Create a map of profiles by user ID for quick lookup
            const profilesMap = new Map();
            if (profilesData) {
              profilesData.forEach((profile: EnhancedProfile) => {
                profilesMap.set(profile.id, profile);
              });
            }
            
            // Map auth users to our format, enriched with profile data
            const mappedUsers = authUsers.users.map((authUser, index) => {
              const profile = profilesMap.get(authUser.id) as EnhancedProfile | undefined;
              
              return {
                id: authUser.id,
                email: authUser.email || 'No email',
                username: profile?.full_name || authUser.user_metadata?.full_name || 'User',
                isAdmin: authUser.email === "alliahalexis.cinco@neu.edu.ph",
                permissions: profile?.permissions || DEFAULT_PERMISSIONS,
                index: index + 1 // Add 1-based indexing
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

      // Update the permissions in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          permissions: updatedPermissions,
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

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
                  <TableHead className="bg-background sticky top-0 z-20">User ID</TableHead>
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
