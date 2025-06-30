'use client';

import { ArrowLeft, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';

interface ClientHeaderProps {
  client: Client;
}

export function ClientHeader({ client }: ClientHeaderProps) {
  const router = useRouter();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      const result = await apiClient.generateReport(client.id);
      
      if (result.success) {
        // Show success message or download file
        alert('Reporte generado exitosamente');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar el reporte');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="pl-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        <div>
          <h1 className="text-3xl font-bold">
            {client.first_name} {client.last_name}
          </h1>
          <p className="text-muted-foreground">{client.email}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
          className="flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>{isGeneratingReport ? 'Generando...' : 'Generar Reporte'}</span>
        </Button>
      </div>
    </div>
  );
} 