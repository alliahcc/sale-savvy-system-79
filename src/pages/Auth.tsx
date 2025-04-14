
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '@/components/auth/AuthForm';

const Auth: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="w-full max-w-md animate-fadeIn">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Welcome to SaleSavvy</h1>
        <p className="text-muted-foreground mt-2">Your complete sales management solution</p>
      </div>
      <AuthForm />
    </div>
  );
};

export default Auth;
