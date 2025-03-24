/**
 * Utility functions for formatting values
 */

/**
 * Format a price in pence to pounds with a £ symbol
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2
  }).format(price / 100);
};

/**
 * Calculate a discount percentage 
 */
export const calculateDiscount = (originalPrice: number, discountedPrice: number): number => {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

/**
 * Format price per walk from a subscription plan
 */
export const formatPricePerWalk = (totalPrice: number, walksPerMonth: number): string => {
  if (walksPerMonth === 0) return formatPrice(0);
  const pricePerWalk = totalPrice / walksPerMonth;
  return formatPrice(pricePerWalk);
};

/**
 * Format a number with commas for thousands
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-GB').format(num);
};

/**
 * Format a percentage with % symbol
 */
export const formatPercentage = (percent: number): string => {
  return `${Math.round(percent)}%`;
}; 