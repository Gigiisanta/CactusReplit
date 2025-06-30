import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==============================
// 🌵 UTILITY FUNCTIONS
// ==============================

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
}

export function getRiskProfileLabel(riskProfile: string): string {
  const profiles: Record<string, string> = {
    'conservative': 'Conservative',
    'moderate': 'Moderate',
    'aggressive': 'Aggressive',
    'very_aggressive': 'Very Aggressive',
    'low': 'Low Risk',
    'medium': 'Medium Risk',
    'high': 'High Risk'
  };
  return profiles[riskProfile] || riskProfile;
}

export function getRiskProfileColor(riskProfile: string): string {
  const colors: Record<string, string> = {
    'conservative': 'bg-green-100 text-green-800',
    'moderate': 'bg-blue-100 text-blue-800',
    'aggressive': 'bg-orange-100 text-orange-800',
    'very_aggressive': 'bg-red-100 text-red-800',
    'low': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-red-100 text-red-800'
  };
  return colors[riskProfile] || 'bg-gray-100 text-gray-800';
}
