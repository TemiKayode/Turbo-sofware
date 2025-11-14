// Country to Currency mapping
export interface Country {
  code: string
  name: string
  currency: string
  currencySymbol: string
}

export const countries: Country[] = [
  { code: 'US', name: 'United States', currency: 'USD', currencySymbol: '$' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£' },
  { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: 'C$' },
  { code: 'AU', name: 'Australia', currency: 'AUD', currencySymbol: 'A$' },
  { code: 'DE', name: 'Germany', currency: 'EUR', currencySymbol: '€' },
  { code: 'FR', name: 'France', currency: 'EUR', currencySymbol: '€' },
  { code: 'IT', name: 'Italy', currency: 'EUR', currencySymbol: '€' },
  { code: 'ES', name: 'Spain', currency: 'EUR', currencySymbol: '€' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', currencySymbol: '€' },
  { code: 'BE', name: 'Belgium', currency: 'EUR', currencySymbol: '€' },
  { code: 'AT', name: 'Austria', currency: 'EUR', currencySymbol: '€' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', currencySymbol: '€' },
  { code: 'IE', name: 'Ireland', currency: 'EUR', currencySymbol: '€' },
  { code: 'FI', name: 'Finland', currency: 'EUR', currencySymbol: '€' },
  { code: 'GR', name: 'Greece', currency: 'EUR', currencySymbol: '€' },
  { code: 'JP', name: 'Japan', currency: 'JPY', currencySymbol: '¥' },
  { code: 'CN', name: 'China', currency: 'CNY', currencySymbol: '¥' },
  { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', currencySymbol: 'R$' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', currencySymbol: '$' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', currencySymbol: '$' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencySymbol: 'R' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', currencySymbol: '₦' },
  { code: 'KE', name: 'Kenya', currency: 'KES', currencySymbol: 'KSh' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', currencySymbol: 'E£' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', currencySymbol: 'د.إ' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', currencySymbol: '﷼' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', currencySymbol: 'S$' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', currencySymbol: 'RM' },
  { code: 'TH', name: 'Thailand', currency: 'THB', currencySymbol: '฿' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', currencySymbol: 'Rp' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', currencySymbol: '₱' },
  { code: 'VN', name: 'Vietnam', currency: 'VND', currencySymbol: '₫' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', currencySymbol: '₩' },
  { code: 'TW', name: 'Taiwan', currency: 'TWD', currencySymbol: 'NT$' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', currencySymbol: 'HK$' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', currencySymbol: 'NZ$' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', currencySymbol: 'CHF' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', currencySymbol: 'kr' },
  { code: 'NO', name: 'Norway', currency: 'NOK', currencySymbol: 'kr' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', currencySymbol: 'kr' },
  { code: 'PL', name: 'Poland', currency: 'PLN', currencySymbol: 'zł' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK', currencySymbol: 'Kč' },
  { code: 'HU', name: 'Hungary', currency: 'HUF', currencySymbol: 'Ft' },
  { code: 'RO', name: 'Romania', currency: 'RON', currencySymbol: 'lei' },
  { code: 'TR', name: 'Turkey', currency: 'TRY', currencySymbol: '₺' },
  { code: 'RU', name: 'Russia', currency: 'RUB', currencySymbol: '₽' },
  { code: 'IL', name: 'Israel', currency: 'ILS', currencySymbol: '₪' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', currencySymbol: '₨' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT', currencySymbol: '৳' },
  { code: 'LK', name: 'Sri Lanka', currency: 'LKR', currencySymbol: 'Rs' },
  { code: 'NP', name: 'Nepal', currency: 'NPR', currencySymbol: '₨' },
]

export function getCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code === code)
}

export function getCurrencyByCountry(countryCode: string): { currency: string; symbol: string } | null {
  const country = getCountryByCode(countryCode)
  return country ? { currency: country.currency, symbol: country.currencySymbol } : null
}

