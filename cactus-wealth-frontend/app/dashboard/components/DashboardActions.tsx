'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Download, FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { useDashboardActions } from '@/hooks/useDashboardActions';

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  risk_profile: string;
}

export default function DashboardActions() {
  const {
    isGeneratingReport,
    isDialogOpen,
    error,
    clientsLoading,
    clients,
    selectedClientId,
    setSelectedClientId,
    handleDialogOpen,
    handleDialogClose,
    handleGenerateReport,
    setIsDialogOpen,
    setClients,
    setClientsLoading,
    setError,
  } = useDashboardActions();

  const fetchClients = useCallback(async () => {
    try {
      setClientsLoading(true);
      const clientData = await apiClient.getClients();
      setClients(clientData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients');
    } finally {
      setClientsLoading(false);
    }
  }, [setClients, setClientsLoading, setError]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <>
      {/* Error Display */}
      {error && (
        <div className='mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700'>
          {error}
        </div>
      )}

      {/* Quick Actions Card */}
      <Card className='card-hover'>
        <CardHeader>
          <CardTitle className='text-cactus-700'>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Link href='/dashboard/clients'>
            <Button variant='outline' className='w-full justify-between'>
              View All Clients
              <ArrowRight className='h-4 w-4' />
            </Button>
          </Link>
          <Link href='/dashboard/clients'>
            <Button variant='outline' className='w-full justify-between'>
              Add New Client
              <ArrowRight className='h-4 w-4' />
            </Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant='outline' className='w-full justify-between'>
                Generate Report
                <FileText className='h-4 w-4' />
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle>Generate Portfolio Report</DialogTitle>
                <DialogDescription>
                  Select a client to generate a comprehensive portfolio report
                </DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='space-y-2'>
                  <label
                    htmlFor='client-select'
                    className='text-sm font-medium'
                  >
                    Select Client
                  </label>
                  <Select
                    value={selectedClientId}
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Choose a client...' />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsLoading ? (
                        <SelectItem value='loading' disabled>
                          Loading clients...
                        </SelectItem>
                      ) : clients.length > 0 ? (
                        clients.map((client) => (
                          <SelectItem
                            key={client.id}
                            value={client.id.toString()}
                          >
                            {client.first_name} {client.last_name} (
                            {client.email})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value='no-clients' disabled>
                          No clients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setIsDialogOpen(false)}
                  className='flex-1'
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={!selectedClientId || isGeneratingReport}
                  className='flex-1'
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className='mr-2 h-4 w-4' />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </>
  );
}
