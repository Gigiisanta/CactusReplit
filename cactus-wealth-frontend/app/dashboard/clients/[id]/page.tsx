'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api'
import { Client, PortfolioValuation } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  formatCurrency, 
  formatPercentage, 
  formatDate, 
  getRiskProfileColor, 
  getRiskProfileLabel 
} from '@/lib/utils'
import { 
  ArrowLeft, 
  Download, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  FileText,
  User,
  Mail,
  Calendar,
  Shield
} from 'lucide-react'

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = parseInt(params.id as string)
  
  const [client, setClient] = useState<Client | null>(null)
  const [portfolioValuation, setPortfolioValuation] = useState<PortfolioValuation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (clientId) {
      fetchClientData()
    }
  }, [clientId, fetchClientData])

  const fetchClientData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Fetch client details
      const clientData = await apiClient.getClient(clientId)
      setClient(clientData)

      // If client has portfolios, fetch the first portfolio valuation
      // In a real app, you would let the user select which portfolio to view
      if (clientData.portfolios && clientData.portfolios.length > 0) {
        const portfolioId = clientData.portfolios[0].id
        try {
          const valuationData = await apiClient.getPortfolioValuation(portfolioId)
          setPortfolioValuation(valuationData)
        } catch (valuationError) {
          console.error('Failed to fetch portfolio valuation:', valuationError)
          // Do not set error here as client data was successful
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch client data')
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  const handleDownloadReport = async () => {
    if (!portfolioValuation) return

    try {
      setIsDownloading(true)
      const blob = await apiClient.downloadPortfolioReport(portfolioValuation.portfolio_id)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `portfolio-report-${client?.first_name}-${client?.last_name}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to download report')
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cactus-500"></div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Client not found</h2>
        <p className="text-gray-600 mb-4">The requested client could not be found.</p>
        <Link href="/dashboard/clients">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-cactus-700">
              {client.first_name} {client.last_name}
            </h1>
            <p className="text-gray-600">Client Portfolio & Details</p>
          </div>
        </div>
        {portfolioValuation && (
          <Button 
            variant="cactus" 
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Generating...' : 'Download Report'}
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Risk Profile</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskProfileColor(client.risk_profile)}`}>
                    {getRiskProfileLabel(client.risk_profile)}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Client Since</p>
                  <p className="font-medium">{formatDate(client.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Portfolios</p>
                  <p className="font-medium">{client.portfolios?.length || 0} Portfolio(s)</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Valuation */}
      {portfolioValuation ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cactus-600">
                {formatCurrency(portfolioValuation.total_value)}
              </div>
              <p className="text-xs text-muted-foreground">
                Current market value
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              {portfolioValuation.total_pnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolioValuation.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolioValuation.total_pnl)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatPercentage(portfolioValuation.total_pnl_percentage)}
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Basis</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {formatCurrency(portfolioValuation.total_cost_basis)}
              </div>
              <p className="text-xs text-muted-foreground">
                {portfolioValuation.positions_count} positions
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Valuation</CardTitle>
            <CardDescription>
              No portfolio data available for this client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Portfolio Data</h3>
              <p className="text-gray-500">This client doesn't have any portfolio data yet.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Details */}
      {portfolioValuation && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Details: {portfolioValuation.portfolio_name}</CardTitle>
            <CardDescription>
              Last updated: {formatDate(portfolioValuation.last_updated)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">{formatCurrency(portfolioValuation.total_value)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost Basis:</span>
                    <span className="font-medium">{formatCurrency(portfolioValuation.total_cost_basis)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P&L:</span>
                    <span className={`font-medium ${portfolioValuation.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(portfolioValuation.total_pnl)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P&L %:</span>
                    <span className={`font-medium ${portfolioValuation.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(portfolioValuation.total_pnl_percentage)}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Portfolio Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Positions:</span>
                    <span className="font-medium">{portfolioValuation.positions_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Profile:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskProfileColor(client.risk_profile)}`}>
                      {getRiskProfileLabel(client.risk_profile)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 