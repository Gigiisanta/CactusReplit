import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Client } from '@/types';

export function useDashboardActions() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientsLoading, setClientsLoading] = useState(true);

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
  }, []);

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
    fetchClients();
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedClientId('');
    setError(null);
  };

  const handleGenerateReport = useCallback(async () => {
    if (!selectedClientId) {
      setError('Please select a client');
      return;
    }
    setIsGeneratingReport(true);
    setError(null);
    try {
      const response = await apiClient.generateReport(
        parseInt(selectedClientId),
        'PORTFOLIO_SUMMARY'
      );
      if (response.success) {
        alert(`Report generated successfully! ${response.message}`);
        setIsDialogOpen(false);
        setSelectedClientId('');
        if (response.report_id) {
          try {
            const token = localStorage.getItem('cactus_token');
            const downloadResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/reports/${response.report_id}/download`,
              {
                method: 'GET',
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              }
            );
            if (downloadResponse.ok) {
              const blob = await downloadResponse.blob();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `portfolio_report_${selectedClientId}_${new Date().toISOString().split('T')[0]}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }
          } catch (downloadError) {
            console.error('Error downloading report:', downloadError);
          }
        }
      } else {
        setError(response.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [selectedClientId]);

  return {
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
  };
}
