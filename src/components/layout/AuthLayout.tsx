
import React from 'react';
import { Outlet } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 to-blue-100">
      <header className="p-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-sale" />
          <span className="font-bold text-xl">SaleSavvy</span>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>
      
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} SaleSavvy. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AuthLayout;
