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
import { UserRole } from '@/types';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.JUNIOR_ADVISOR);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register(username, email, password, role);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
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
              Create Account
            </CardTitle>
            <CardDescription className='text-center'>
              Join our financial advisory platform
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
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='advisor@cactuswealth.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='role'>Role</Label>
                <select
                  id='role'
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className='w-full rounded-md border bg-white p-2'
                  disabled={isLoading}
                  required
                >
                  <option value={UserRole.JUNIOR_ADVISOR}>
                    Junior Financial Advisor
                  </option>
                  <option value={UserRole.SENIOR_ADVISOR}>
                    Senior Financial Advisor
                  </option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                </select>
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
                  minLength={6}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirm Password</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  placeholder='Confirm your password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
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
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className='mt-4 text-center'>
              <p className='text-sm text-sage-600'>
                Already have an account?{' '}
                <Link
                  href='/login'
                  className='font-medium text-cactus-600 hover:text-cactus-700'
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
