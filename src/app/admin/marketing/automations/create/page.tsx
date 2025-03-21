'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';

// Mock data for selections
const audienceSegments = [
  { id: 'seg1', name: 'Active Subscribers' },
  { id: 'seg2', name: 'Churned Customers' },
  { id: 'seg3', name: 'Premium Plan Users' },
  { id: 'seg4', name: 'Low Usage Subscribers' },
  { id: 'seg5', name: 'Expiring Subscriptions' }
];

const emailTemplates = [
  { id: 'template1', name: 'Welcome Email', type: 'email' },
  { id: 'template2', name: 'Subscription Renewal', type: 'email' },
  { id: 'template3', name: 'Monthly Newsletter', type: 'email' },
  { id: 'template4', name: 'Upgrade Promotion', type: 'email' },
  { id: 'template5', name: 'Account Expiration', type: 'email' },
  { id: 'template6', name: 'Appointment Confirmation', type: 'sms' }
];

const triggerTypes = [
  { id: 'signup', name: 'New Sign Up', description: 'Triggered when a user creates a new account' },
  { id: 'cart_abandon', name: 'Cart Abandonment', description: 'Triggered when a user leaves items in cart without checkout' },
  { id: 'time_before_expiry', name: 'Time Before Expiry', description: 'Triggered a set time before subscription expires' },
  { id: 'inactivity', name: 'User Inactivity', description: 'Triggered when a user has not logged in for a set period' },
  { id: 'purchase', name: 'Purchase Completed', description: 'Triggered after a user completes a purchase' }
];

// Initial step template
const createInitialStep = (number: number) => ({
  id: crypto.randomUUID(),
  number,
  name: `Step ${number}`,
  type: 'email',
  templateId: '',
  delay: {
    value: 0,
    unit: 'days' // days, hours, minutes
  },
  conditions: []
});

// Initial form state
const initialFormState = {
  name: '',
  description: '',
  status: 'draft', // draft, active, paused
  trigger: {
    type: '',
    settings: {} as Record<string, any>
  },
  audienceId: '',
  steps: [createInitialStep(1)]
};

export default function CreateAutomationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(formData.steps[0]?.id || null);

  // Handle basic form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle trigger type change
  const handleTriggerTypeChange = (triggerId: string) => {
    const triggerSettings: Record<string, any> = {};
    
    // Set default values based on trigger type
    if (triggerId === 'time_before_expiry') {
      triggerSettings.timeValue = 7;
      triggerSettings.timeUnit = 'days';
    } else if (triggerId === 'inactivity') {
      triggerSettings.days = 30;
    } else if (triggerId === 'purchase') {
      triggerSettings.productCategory = 'all';
    }
    
    setFormData(prev => ({
      ...prev,
      trigger: {
        type: triggerId,
        settings: triggerSettings
      }
    }));
  };

  // Handle trigger setting change
  const handleTriggerSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        settings: {
          ...prev.trigger.settings,
          [name]: value
        }
      }
    }));
  };

  // Handle step field changes
  const handleStepChange = (stepId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, [field]: value } : step
      )
    }));
  };

  // Handle step delay changes
  const handleStepDelayChange = (stepId: string, field: 'value' | 'unit', value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, delay: { ...step.delay, [field]: value } } 
          : step
      )
    }));
  };

  // Add new step
  const addStep = () => {
    const newStepNumber = formData.steps.length + 1;
    const newStep = createInitialStep(newStepNumber);
    
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
    
    setActiveStep(newStep.id);
  };

  // Remove step
  const removeStep = (stepId: string) => {
    if (formData.steps.length <= 1) {
      setFormError('An automation must have at least one step');
      return;
    }
    
    const updatedSteps = formData.steps
      .filter(step => step.id !== stepId)
      .map((step, idx) => ({
        ...step,
        number: idx + 1,
        name: step.name === `Step ${step.number}` ? `Step ${idx + 1}` : step.name
      }));
    
    setFormData(prev => ({
      ...prev,
      steps: updatedSteps
    }));
    
    if (activeStep === stepId) {
      setActiveStep(updatedSteps[0]?.id || null);
    }
  };

  // Handle step order change (move up/down)
  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    const currentIndex = formData.steps.findIndex(step => step.id === stepId);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === formData.steps.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updatedSteps = [...formData.steps];
    
    // Swap positions
    [updatedSteps[currentIndex], updatedSteps[newIndex]] = [updatedSteps[newIndex], updatedSteps[currentIndex]];
    
    // Update step numbers and names
    const renamedSteps = updatedSteps.map((step, idx) => ({
      ...step,
      number: idx + 1,
      name: step.name === `Step ${step.number}` ? `Step ${idx + 1}` : step.name
    }));
    
    setFormData(prev => ({
      ...prev,
      steps: renamedSteps
    }));
  };

  // Get trigger configuration UI based on selected trigger type
  const getTriggerConfig = () => {
    if (!formData.trigger.type) return null;
    
    switch (formData.trigger.type) {
      case 'signup':
        return (
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-700">
              This automation will be triggered immediately when a new user signs up.
            </p>
          </div>
        );
        
      case 'cart_abandon':
        return (
          <div className="space-y-4">
            <div className="flex items-end space-x-2">
              <div>
                <label htmlFor="timeValue" className="block text-sm font-medium text-gray-700">
                  Trigger after cart is abandoned for
                </label>
                <input
                  type="number"
                  id="timeValue"
                  name="timeValue"
                  min="1"
                  value={formData.trigger.settings.timeValue || 1}
                  onChange={handleTriggerSettingChange}
                  className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div>
                <select
                  id="timeUnit"
                  name="timeUnit"
                  value={formData.trigger.settings.timeUnit || 'hours'}
                  onChange={handleTriggerSettingChange}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'time_before_expiry':
        return (
          <div className="space-y-4">
            <div className="flex items-end space-x-2">
              <div>
                <label htmlFor="timeValue" className="block text-sm font-medium text-gray-700">
                  Trigger
                </label>
                <input
                  type="number"
                  id="timeValue"
                  name="timeValue"
                  min="1"
                  value={formData.trigger.settings.timeValue || 7}
                  onChange={handleTriggerSettingChange}
                  className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <div>
                <select
                  id="timeUnit"
                  name="timeUnit"
                  value={formData.trigger.settings.timeUnit || 'days'}
                  onChange={handleTriggerSettingChange}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
              <p className="text-sm text-gray-700">before subscription expires</p>
            </div>
          </div>
        );
        
      case 'inactivity':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="days" className="block text-sm font-medium text-gray-700">
                Number of days of inactivity
              </label>
              <input
                type="number"
                id="days"
                name="days"
                min="1"
                value={formData.trigger.settings.days || 30}
                onChange={handleTriggerSettingChange}
                className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
        );
        
      case 'purchase':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="productCategory" className="block text-sm font-medium text-gray-700">
                Product Category
              </label>
              <select
                id="productCategory"
                name="productCategory"
                value={formData.trigger.settings.productCategory || 'all'}
                onChange={handleTriggerSettingChange}
                className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="all">All Products</option>
                <option value="subscription">Subscriptions</option>
                <option value="addon">Add-ons</option>
                <option value="service">Services</option>
              </select>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Automation name is required');
      return false;
    }

    if (!formData.trigger.type) {
      setFormError('Please select a trigger type');
      return false;
    }

    if (!formData.audienceId) {
      setFormError('Please select an audience segment');
      return false;
    }

    // Validate each step
    for (const step of formData.steps) {
      if (!step.templateId) {
        setFormError(`Please select a template for step ${step.number}`);
        setActiveStep(step.id);
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
      
      // In a real app, this would make an API call to create the automation
      console.log('Creating automation with data:', formData);
      
      // Redirect to automations management page after successful creation
      router.push('/admin/marketing/automations');
    } catch (error) {
      console.error('Error creating automation:', error);
      setFormError('Failed to create automation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Get step configuration UI
  const getStepConfig = (step: typeof formData.steps[0]) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
          <div>
            <label htmlFor={`step-${step.id}-name`} className="block text-sm font-medium text-gray-700">
              Step Name
            </label>
            <input
              type="text"
              id={`step-${step.id}-name`}
              value={step.name}
              onChange={(e) => handleStepChange(step.id, 'name', e.target.value)}
              className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor={`step-${step.id}-type`} className="block text-sm font-medium text-gray-700">
              Message Type
            </label>
            <select
              id={`step-${step.id}-type`}
              value={step.type}
              onChange={(e) => handleStepChange(step.id, 'type', e.target.value)}
              className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor={`step-${step.id}-template`} className="block text-sm font-medium text-gray-700">
              Template
            </label>
            <select
              id={`step-${step.id}-template`}
              value={step.templateId}
              onChange={(e) => handleStepChange(step.id, 'templateId', e.target.value)}
              className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Select Template</option>
              {emailTemplates
                .filter(template => template.type === step.type)
                .map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))
              }
            </select>
          </div>
          
          {step.number > 1 && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Wait Before Sending
              </label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  value={step.delay.value}
                  onChange={(e) => handleStepDelayChange(step.id, 'value', parseInt(e.target.value) || 0)}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-24 sm:text-sm border-gray-300 rounded-md"
                />
                <select
                  value={step.delay.unit}
                  onChange={(e) => handleStepDelayChange(step.id, 'unit', e.target.value)}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
                <span className="text-sm text-gray-500">after previous step</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'marketing_automations' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Automation</h1>
            <p className="mt-1 text-sm text-gray-500">
              Set up an automated marketing workflow to engage with your audience
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/admin/marketing/automations"
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
                Basic Information
              </h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Automation Name</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., Welcome Series"
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
                      placeholder="Describe the purpose of this automation"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Draft automations won't be triggered until activated.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="audienceId" className="block text-sm font-medium text-gray-700">Target Audience</label>
                  <select
                    id="audienceId"
                    name="audienceId"
                    value={formData.audienceId}
                    onChange={handleInputChange}
                    className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select Audience</option>
                    {audienceSegments.map(segment => (
                      <option key={segment.id} value={segment.id}>{segment.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Trigger Settings
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Define when this automation should be triggered
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Trigger Type
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {triggerTypes.map(trigger => (
                      <div 
                        key={trigger.id}
                        onClick={() => handleTriggerTypeChange(trigger.id)}
                        className={`
                          border rounded-lg p-4 cursor-pointer transition-colors
                          ${formData.trigger.type === trigger.id 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                      >
                        <div className="flex items-start">
                          <div className={`
                            mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center
                            ${formData.trigger.type === trigger.id 
                              ? 'border-primary-600 bg-primary-600' 
                              : 'border-gray-500'
                            }
                          `}>
                            {formData.trigger.type === trigger.id && (
                              <div className="h-2 w-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900">{trigger.name}</h3>
                            <p className="mt-1 text-xs text-gray-500">{trigger.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.trigger.type && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Trigger Configuration
                    </label>
                    {getTriggerConfig()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Automation Steps
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Configure the sequence of messages in this automation
              </p>
            </div>
            <div className="sm:px-6 sm:pt-6">
              <div className="flex flex-col sm:flex-row">
                {/* Step list sidebar */}
                <div className="sm:w-64 border-b sm:border-b-0 sm:border-r border-gray-200">
                  <ul className="divide-y divide-gray-200">
                    {formData.steps.map((step) => (
                      <li 
                        key={step.id} 
                        onClick={() => setActiveStep(step.id)}
                        className={`
                          px-4 py-3 flex items-center justify-between cursor-pointer
                          ${activeStep === step.id ? 'bg-primary-50' : 'hover:bg-gray-50'}
                        `}
                      >
                        <div className="flex items-center">
                          <div className={`
                            flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full
                            ${activeStep === step.id 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-gray-200 text-gray-500'
                            }
                          `}>
                            {step.number}
                          </div>
                          <div className="ml-3">
                            <p className={`
                              text-sm font-medium
                              ${activeStep === step.id ? 'text-primary-700' : 'text-gray-900'}
                            `}>
                              {step.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {step.type === 'email' ? 'Email' : 'SMS'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {step.number > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(step.id, 'up');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          
                          {step.number < formData.steps.length && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(step.id, 'down');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStep(step.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                    
                    <li className="px-4 py-3">
                      <button
                        type="button"
                        onClick={addStep}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Step
                      </button>
                    </li>
                  </ul>
                </div>
                
                {/* Step editor */}
                <div className="flex-1 p-4 sm:p-6">
                  {activeStep && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Configure Step
                      </h3>
                      {getStepConfig(formData.steps.find(step => step.id === activeStep)!)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/marketing/automations"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Automation'}
            </button>
          </div>
        </form>
      </div>
    </RouteGuard>
  );
} 