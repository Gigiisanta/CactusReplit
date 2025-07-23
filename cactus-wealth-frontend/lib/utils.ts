import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export function formatPercentage(
  percentage: number,
  decimals: number = 2
): string {
  return `${percentage.toFixed(decimals)}%`;
}

export function formatDate(
  date: Date | string | null,
  format: 'default' | 'short' | 'long' = 'default',
  locale: string = 'en-US'
): string {
  if (!date) return 'Invalid Date';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return 'Invalid Date';

    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString(locale);
      case 'long':
        return dateObj.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      default:
        return dateObj.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
    }
  } catch {
    return 'Invalid Date';
  }
}

export function truncateText(
  text: string | null | undefined,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPhoneNumber(
  phone: string,
  country: string = 'US'
): string {
  if (!phone) return '';

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  if (country === 'US' && digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (phone.startsWith('+') && digits.length >= 10) {
    const countryCode = phone.slice(0, 2);
    const areaCode = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7, 11);
    return `${countryCode} (${areaCode}) ${prefix}-${line}`;
  }

  return phone;
}

export function validateEmail(email: string): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2);
  const id = `${timestamp}_${randomStr}`;
  return prefix ? `${prefix}_${id}` : id;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function getRiskProfileLabel(riskProfile: string): string {
  const profiles: Record<string, string> = {
    conservative: 'Conservative',
    moderate: 'Moderate',
    aggressive: 'Aggressive',
    very_aggressive: 'Very Aggressive',
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
  };
  return profiles[riskProfile] || riskProfile;
}

export function getRiskProfileColor(riskProfile: string): string {
  const colors: Record<string, string> = {
    conservative: 'bg-green-100 text-green-800',
    moderate: 'bg-blue-100 text-blue-800',
    aggressive: 'bg-orange-100 text-orange-800',
    very_aggressive: 'bg-red-100 text-red-800',
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  return colors[riskProfile] || 'bg-gray-100 text-gray-800';
}
