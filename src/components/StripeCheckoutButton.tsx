import { useState } from 'react';
import { SubscriptionPlan } from '@/lib/types';

interface StripeCheckoutButtonProps {
  plan: SubscriptionPlan;
  buttonText?: string;
  className?: string;
}

export default function StripeCheckoutButton({
  plan,
  buttonText = 'Subscribe',
  className = '',
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      
      // Make API call to create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className={`px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors ${
        isLoading ? 'opacity-70 cursor-not-allowed' : ''
      } ${className}`}
    >
      {isLoading ? 'Processing...' : buttonText}
    </button>
  );
} 