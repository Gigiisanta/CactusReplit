'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-cactus-50 to-sage-100 p-4'>
      <div className='w-full max-w-md'>
        <div className='mb-8 text-center'>
          <h1 className='mb-2 text-4xl font-bold text-cactus-700'>🌵</h1>
          <h2 className='text-3xl font-bold text-cactus-700'>Cactus Wealth</h2>
          <p className='mt-2 text-sage-600'>Financial Advisory Dashboard</p>
        </div>

        <Card className='brand-shadow'>
          <CardHeader>
            <CardTitle className='text-center text-2xl text-cactus-700'>
              Sign In
            </CardTitle>
            <CardDescription className='text-center'>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='username'>Username</Label>
                <Input
                  id='username'
                  type='text'
                  placeholder='your-username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='Enter your password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              {error && (
                <div className='rounded-md bg-red-50 p-2 text-center text-sm text-red-600'>
                  {error}
                </div>
              )}
              <Button
                type='submit'
                variant='cactus'
                className='w-full'
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className='mt-4 text-center'>
              <p className='text-sm text-sage-600'>
                Don't have an account?{' '}
                <Link
                  href='/register'
                  className='font-medium text-cactus-600 hover:text-cactus-700'
                >
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className='mt-6 text-center text-sm text-sage-600'>
          <p>Demo Credentials:</p>
          <p>Username: demo</p>
          <p>Password: demo123</p>
        </div>
      </div>
    </div>
  );
}
