'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';

// Rule types for condition builder
const ruleTypes = [
  { id: 'subscription_status', name: 'Subscription Status' },
  { id: 'subscription_plan', name: 'Subscription Plan' },
  { id: 'subscription_expiry', name: 'Subscription Expiry' },
  { id: 'last_login', name: 'Last Login' },
  { id: 'usage_frequency', name: 'Usage Frequency' },
  { id: 'total_spend', name: 'Total Spend' },
  { id: 'location', name: 'Location' },
  { id: 'signup_date', name: 'Signup Date' },
  { id: 'tags', name: 'Tags' }
];

// Mock subscription plans for dropdowns
const subscriptionPlans = [
  { id: 'basic', name: 'Basic Plan' },
  { id: 'premium', name: 'Premium Plan' },
  { id: 'pro', name: 'Professional Plan' },
  { id: 'enterprise', name: 'Enterprise Plan' }
];

// Initial form state
const initialFormState = {
  name: '',
  description: '',
  matchType: 'all', // 'all' for AND, 'any' for OR
  rules: [{ id: crypto.randomUUID(), type: '', operator: '', value: '' }]
};

export default function CreateSegmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle rule field changes
  const handleRuleChange = (ruleId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.map(rule => 
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      )
    }));
  };

  // Add new rule
  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, { id: crypto.randomUUID(), type: '', operator: '', value: '' }]
    }));
  };

  // Remove rule
  const removeRule = (ruleId: string) => {
    if (formData.rules.length <= 1) {
      setFormError('At least one rule is required');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId)
    }));
    setFormError(null);
  };

  // Get operators based on rule type
  const getOperators = (ruleType: string) => {
    switch (ruleType) {
      case 'subscription_status':
        return [
          { id: 'is', name: 'is' },
          { id: 'is_not', name: 'is not' }
        ];
      case 'subscription_plan':
        return [
          { id: 'is', name: 'is' },
          { id: 'is_not', name: 'is not' }
        ];
      case 'subscription_expiry':
        return [
          { id: 'within', name: 'expires within' },
          { id: 'not_within', name: 'does not expire within' },
          { id: 'after', name: 'expires after' },
          { id: 'before', name: 'expires before' }
        ];
      case 'last_login':
        return [
          { id: 'within', name: 'within the last' },
          { id: 'not_within', name: 'not within the last' },
          { id: 'before', name: 'before' },
          { id: 'after', name: 'after' }
        ];
      case 'usage_frequency':
        return [
          { id: 'greater_than', name: 'greater than' },
          { id: 'less_than', name: 'less than' },
          { id: 'equal', name: 'equal to' }
        ];
      case 'total_spend':
        return [
          { id: 'greater_than', name: 'greater than' },
          { id: 'less_than', name: 'less than' },
          { id: 'between', name: 'between' }
        ];
      case 'location':
        return [
          { id: 'in', name: 'in' },
          { id: 'not_in', name: 'not in' }
        ];
      case 'signup_date':
        return [
          { id: 'before', name: 'before' },
          { id: 'after', name: 'after' },
          { id: 'between', name: 'between' }
        ];
      case 'tags':
        return [
          { id: 'contains', name: 'contains' },
          { id: 'not_contains', name: 'does not contain' }
        ];
      default:
        return [];
    }
  };

  // Get value input type based on rule type and operator
  const getValueInput = (rule: { id: string; type: string; operator: string; value: string }) => {
    if (!rule.type || !rule.operator) {
      return null;
    }

    switch (rule.type) {
      case 'subscription_status':
        return (
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={rule.value}
            onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
          >
            <option value="">Select Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
        );
      case 'subscription_plan':
        return (
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            value={rule.value}
            onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
          >
            <option value="">Select Plan</option>
            {subscriptionPlans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        );
      case 'subscription_expiry':
      case 'last_login':
        if (rule.operator === 'within' || rule.operator === 'not_within') {
          return (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Number"
                value={rule.value}
                onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
              />
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={rule.value.split(':')[1] || 'days'}
                onChange={(e) => {
                  const num = rule.value.split(':')[0] || '';
                  handleRuleChange(rule.id, 'value', `${num}:${e.target.value}`);
                }}
              >
                <option value="days">days</option>
                <option value="weeks">weeks</option>
                <option value="months">months</option>
              </select>
            </div>
          );
        } else {
          return (
            <input
              type="date"
              className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
              value={rule.value}
              onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
            />
          );
        }
      case 'usage_frequency':
        return (
          <input
            type="number"
            className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Times per month"
            value={rule.value}
            onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
          />
        );
      case 'total_spend':
        return (
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              className="mt-1 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
              placeholder="Amount"
              value={rule.value}
              onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
            />
          </div>
        );
      case 'location':
        return (
          <input
            type="text"
            className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Country or region"
            value={rule.value}
            onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
          />
        );
      case 'tags':
        return (
          <input
            type="text"
            className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Tag name"
            value={rule.value}
            onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
          />
        );
      default:
        return (
          <input
            type="text"
            className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Value"
            value={rule.value}
            onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
          />
        );
    }
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Segment name is required');
      return false;
    }

    for (const rule of formData.rules) {
      if (!rule.type || !rule.operator || !rule.value) {
        setFormError('All rule fields are required');
        return false;
      }
    }

    setFormError(null);
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would make an API call to create the segment
      console.log('Creating segment with data:', formData);
      
      // Redirect to audience management page after successful creation
      router.push('/admin/marketing/audience');
    } catch (error) {
      console.error('Error creating segment:', error);
      setFormError('Failed to create segment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'audience_segments' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Audience Segment</h1>
            <p className="mt-1 text-sm text-gray-500">
              Define a new audience segment for targeted marketing campaigns
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/admin/marketing/audience"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </div>

        {formError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{formError}</h3>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Segment Information
              </h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Segment Name</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., High Value Customers"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Describe the purpose of this segment"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Segment Conditions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Define the rules that determine which users are included in this segment.
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-6">
                <fieldset>
                  <legend className="text-base font-medium text-gray-900">Match Type</legend>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center">
                      <input
                        id="match-all"
                        name="matchType"
                        type="radio"
                        value="all"
                        checked={formData.matchType === 'all'}
                        onChange={handleInputChange}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <label htmlFor="match-all" className="ml-3 block text-sm font-medium text-gray-700">
                        Match ALL conditions (AND)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="match-any"
                        name="matchType"
                        type="radio"
                        value="any"
                        checked={formData.matchType === 'any'}
                        onChange={handleInputChange}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      />
                      <label htmlFor="match-any" className="ml-3 block text-sm font-medium text-gray-700">
                        Match ANY condition (OR)
                      </label>
                    </div>
                  </div>
                </fieldset>
              </div>
              
              <div className="space-y-4">
                {formData.rules.map((rule, index) => (
                  <div key={rule.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium text-gray-700">
                        Condition {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeRule(rule.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          value={rule.type}
                          onChange={(e) => handleRuleChange(rule.id, 'type', e.target.value)}
                        >
                          <option value="">Select Type</option>
                          {ruleTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Operator</label>
                        <select
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          value={rule.operator}
                          onChange={(e) => handleRuleChange(rule.id, 'operator', e.target.value)}
                          disabled={!rule.type}
                        >
                          <option value="">Select Operator</option>
                          {getOperators(rule.type).map(op => (
                            <option key={op.id} value={op.id}>{op.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Value</label>
                        {getValueInput(rule)}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={addRule}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Condition
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/marketing/audience"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Segment'}
            </button>
          </div>
        </form>
      </div>
    </RouteGuard>
  );
} 