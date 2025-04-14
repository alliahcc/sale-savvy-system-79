
import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    // Get current user
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    fetchUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/');
        } else if (session) {
          setUser(session.user);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      name: 'Sales',
      path: '/sales',
      icon: <ShoppingCart className="h-5 w-5" />
    },
    {
      name: 'Employees',
      path: '/employees',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out'
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    
    const fullName = user.user_metadata?.full_name || user.email || '';
    if (!fullName) return 'U';
    
    return fullName.split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar text-sidebar-foreground w-64 flex-shrink-0 transition-all duration-300 fixed md:relative h-screen z-50 shadow-lg",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className={cn("flex items-center gap-2", !isSidebarOpen && "md:justify-center md:w-full")}>
            <TrendingUp className="h-6 w-6 text-sale" />
            {(isSidebarOpen || !isMobile) && <span className={cn("font-bold text-xl", !isSidebarOpen && "md:hidden")}>SaleSavvy</span>}
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-sidebar-foreground">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path} 
                  className={({ isActive }) => cn(
                    "flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent transition-colors",
                    isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground",
                    !isSidebarOpen && "md:justify-center md:px-2"
                  )}
                >
                  {item.icon}
                  {(isSidebarOpen || !isMobile) && <span className={cn("ml-3", !isSidebarOpen && "md:hidden")}>{item.name}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-sidebar-border">
          <Button 
            variant="ghost" 
            className={cn(
              "flex items-center w-full text-sidebar-foreground hover:bg-sidebar-accent",
              !isSidebarOpen && "md:justify-center"
            )} 
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {(isSidebarOpen || !isMobile) && <span className={cn("ml-2", !isSidebarOpen && "md:hidden")}>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white h-16 flex items-center justify-between px-4 border-b shadow-sm">
          <div className="flex items-center">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl font-semibold">
              {navigationItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        
        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
