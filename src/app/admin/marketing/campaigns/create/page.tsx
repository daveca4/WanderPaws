'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
// Removed mock data import

// Mock audience segments for targeting options
const audienceSegments = [
  { id: 'seg_expiring', name: 'Users with Expiring Subscriptions', count: 58 },
  { id: 'seg_low_usage', name: 'Low Usage Subscribers', count: 132 },
  { id: 'seg_high_usage', name: 'High Usage Subscribers', count: 87 },
  { id: 'seg_churned', name: 'Recently Churned Customers', count: 63 },
  { id: 'seg_active', name: 'Active Subscribers', count: 325 },
  { id: 'seg_new', name: 'New Customers (Last 30 Days)', count: 48 },
  { id: 'seg_premium', name: 'Premium Plan Subscribers', count: 75 },
  { id: 'seg_basic', name: 'Basic Plan Subscribers', count: 184 },
  { id: 'seg_all', name: 'All Subscribers', count: 895 }
];

// Mock templates for emails and SMS messages
const emailTemplates = [
  { id: 'tpl_renew', name: 'Subscription Renewal', subject: 'Time to renew your subscription!' },
  { id: 'tpl_discount', name: 'Special Discount Offer', subject: 'Limited time offer: Save 20% on your next subscription' },
  { id: 'tpl_features', name: 'Feature Announcement', subject: 'Exciting new features available!' },
  { id: 'tpl_feedback', name: 'Feedback Request', subject: 'We value your feedback' },
  { id: 'tpl_winback', name: 'Win-Back Campaign', subject: 'We miss you - special offer inside' },
];

const smsTemplates = [
  { id: 'sms_renew', name: 'Short Renewal Reminder', content: 'Your WanderPaws subscription expires soon. Renew now for 10% off: {link}' },
  { id: 'sms_promo', name: 'Promotion Alert', content: 'WanderPaws FLASH SALE: 20% off today only! Use code WANDER20. {link}' },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state
  const [campaignType, setCampaignType] = useState('email');
  const [campaignName, setCampaignName] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customAudience, setCustomAudience] = useState(false);
  const [audienceFilters, setAudienceFilters] = useState({
    plans: [] as string[],
    expiringWithin: '',
    minimumCreditsRemaining: '',
    minimumSpend: '',
    inactiveDays: ''
  });
  const [scheduleSetting, setScheduleSetting] = useState('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [subject, setSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [previewAvailable, setPreviewAvailable] = useState(false);
  
  // Handle template selection to populate subject and content
  useEffect(() => {
    if (selectedTemplate) {
      if (campaignType === 'email') {
        const template = emailTemplates.find(t => t.id === selectedTemplate);
        if (template) {
          setSubject(template.subject);
          setMessageContent(`<p>Dear {first_name},</p>
          
<p>Your subscription is due to expire soon, and we wouldn't want you to miss out on your regular dog walks!</p>

<p>Renew now and we'll add an extra walk credit as a thank you for your continued support.</p>

<p><a href="{renewal_link}" class="button" style="background-color: #4F46E5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Renew My Subscription</a></p>

<p>If you have any questions, please don't hesitate to contact us.</p>

<p>Thank you,<br>
The WanderPaws Team</p>`);
          setPreviewAvailable(true);
        }
      } else if (campaignType === 'sms') {
        const template = smsTemplates.find(t => t.id === selectedTemplate);
        if (template) {
          setMessageContent(template.content);
          setPreviewAvailable(true);
        }
      }
    }
  }, [selectedTemplate, campaignType]);
  
  // Function to validate the form
  const validateForm = (): boolean => {
    if (!campaignName) {
      setFormError('Please enter a campaign name');
      return false;
    }
    
    if (!selectedSegment && !customAudience) {
      setFormError('Please select an audience segment or create a custom audience');
      return false;
    }
    
    if (customAudience && 
        audienceFilters.plans.length === 0 && 
        !audienceFilters.expiringWithin && 
        !audienceFilters.minimumCreditsRemaining && 
        !audienceFilters.minimumSpend && 
        !audienceFilters.inactiveDays) {
      setFormError('Please set at least one filter for your custom audience');
      return false;
    }
    
    if (scheduleSetting === 'scheduled' && (!scheduleDate || !scheduleTime)) {
      setFormError('Please set a date and time for your scheduled campaign');
      return false;
    }
    
    if (campaignType === 'email' && !subject) {
      setFormError('Please enter a subject line for your email');
      return false;
    }
    
    if (!messageContent) {
      setFormError('Please enter content for your message');
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      // In a real app, this would make an API call to save the campaign
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulation: Campaign created successfully
      console.log('Creating campaign with data:', {
        name: campaignName,
        type: campaignType,
        audience: customAudience ? 'Custom' : audienceSegments.find(s => s.id === selectedSegment)?.name,
        audienceFilters: customAudience ? audienceFilters : {},
        scheduling: scheduleSetting,
        scheduledAt: scheduleSetting === 'scheduled' ? `${scheduleDate}T${scheduleTime}` : null,
        subject: subject,
        content: messageContent,
      });
      
      // Redirect to campaigns list
      router.push('/admin/marketing/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      setFormError('Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle plan selection for audience filters
  const handlePlanSelection = (planId: string) => {
    setAudienceFilters(prev => {
      const newPlans = prev.plans.includes(planId)
        ? prev.plans.filter(id => id !== planId)
        : [...prev.plans, planId];
      
      return {
        ...prev,
        plans: newPlans
      };
    });
  };
  
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Marketing Campaign</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a targeted campaign to engage with your subscribers
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/admin/marketing/campaigns"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Campaign type and basics */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Campaign Details</h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                <div className="sm:col-span-2">
                  <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700">
                    Campaign Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="campaign-name"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., Summer Renewal Campaign"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Campaign Type</label>
                  <div className="mt-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          id="type-email"
                          name="campaign-type"
                          type="radio"
                          checked={campaignType === 'email'}
                          onChange={() => setCampaignType('email')}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="type-email" className="ml-2 block text-sm text-gray-700">
                          Email Campaign
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="type-sms"
                          name="campaign-type"
                          type="radio"
                          checked={campaignType === 'sms'}
                          onChange={() => setCampaignType('sms')}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="type-sms" className="ml-2 block text-sm text-gray-700">
                          SMS Campaign
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="type-inapp"
                          name="campaign-type"
                          type="radio"
                          checked={campaignType === 'in-app'}
                          onChange={() => setCampaignType('in-app')}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="type-inapp" className="ml-2 block text-sm text-gray-700">
                          In-App Message
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Scheduling</label>
                  <div className="mt-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          id="schedule-now"
                          name="schedule"
                          type="radio"
                          checked={scheduleSetting === 'now'}
                          onChange={() => setScheduleSetting('now')}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="schedule-now" className="ml-2 block text-sm text-gray-700">
                          Send immediately
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="schedule-later"
                          name="schedule"
                          type="radio"
                          checked={scheduleSetting === 'scheduled'}
                          onChange={() => setScheduleSetting('scheduled')}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                        />
                        <label htmlFor="schedule-later" className="ml-2 block text-sm text-gray-700">
                          Schedule for later
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {scheduleSetting === 'scheduled' && (
                  <div className="sm:col-span-2 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                    <div>
                      <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          id="schedule-date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700">
                        Time
                      </label>
                      <div className="mt-1">
                        <input
                          type="time"
                          id="schedule-time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Audience Targeting */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Audience Targeting</h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Predefined Audience Segments</label>
                    <div className="flex items-center">
                      <input
                        id="custom-audience"
                        name="custom-audience"
                        type="checkbox"
                        checked={customAudience}
                        onChange={(e) => setCustomAudience(e.target.checked)}
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                      <label htmlFor="custom-audience" className="ml-2 block text-sm text-gray-700">
                        Create custom audience
                      </label>
                    </div>
                  </div>
                  
                  {!customAudience ? (
                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {audienceSegments.map((segment) => (
                        <div key={segment.id} className="relative rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm hover:border-gray-400 flex">
                          <div className="flex items-start">
                            <div className="flex h-5 items-center">
                              <input
                                id={segment.id}
                                name="audience-segment"
                                type="radio"
                                checked={selectedSegment === segment.id}
                                onChange={() => setSelectedSegment(segment.id)}
                                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor={segment.id} className="font-medium text-gray-700">{segment.name}</label>
                              <p className="text-gray-500">{segment.count} subscribers</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-6 border rounded-md p-4 bg-gray-50">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Subscription Plan</h3>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {mockSubscriptionPlans.map((plan) => (
                            <div key={plan.id} className="flex items-start">
                              <div className="flex h-5 items-center">
                                <input
                                  id={`plan-${plan.id}`}
                                  name="subscription-plan"
                                  type="checkbox"
                                  checked={audienceFilters.plans.includes(plan.id)}
                                  onChange={() => handlePlanSelection(plan.id)}
                                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor={`plan-${plan.id}`} className="font-medium text-gray-700">{plan.name}</label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                        <div>
                          <label htmlFor="expiring-within" className="block text-sm font-medium text-gray-700">
                            Subscription Expiring Within (Days)
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              id="expiring-within"
                              min="0"
                              value={audienceFilters.expiringWithin}
                              onChange={(e) => setAudienceFilters(prev => ({ ...prev, expiringWithin: e.target.value }))}
                              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="e.g., 30"
                            />
                            <p className="mt-1 text-xs text-gray-500">Users whose subscriptions expire within this many days</p>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="min-credits" className="block text-sm font-medium text-gray-700">
                            Minimum Credits Remaining
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              id="min-credits"
                              min="0"
                              value={audienceFilters.minimumCreditsRemaining}
                              onChange={(e) => setAudienceFilters(prev => ({ ...prev, minimumCreditsRemaining: e.target.value }))}
                              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="e.g., 5"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="min-spend" className="block text-sm font-medium text-gray-700">
                            Minimum Total Spend (£)
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              id="min-spend"
                              min="0"
                              value={audienceFilters.minimumSpend}
                              onChange={(e) => setAudienceFilters(prev => ({ ...prev, minimumSpend: e.target.value }))}
                              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="e.g., 100"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="inactive-days" className="block text-sm font-medium text-gray-700">
                            Inactive for at least (Days)
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              id="inactive-days"
                              min="0"
                              value={audienceFilters.inactiveDays}
                              onChange={(e) => setAudienceFilters(prev => ({ ...prev, inactiveDays: e.target.value }))}
                              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="e.g., 30"
                            />
                            <p className="mt-1 text-xs text-gray-500">Users who haven't used their subscription in this many days</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Message Content */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Message Content</h2>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700">
                    Use Template (Optional)
                  </label>
                  <div className="mt-1">
                    <select
                      id="template"
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">Select a template...</option>
                      {campaignType === 'email' ? (
                        emailTemplates.map(template => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))
                      ) : campaignType === 'sms' ? (
                        smsTemplates.map(template => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))
                      ) : (
                        <option value="">No templates available for in-app messages</option>
                      )}
                    </select>
                  </div>
                </div>
                
                {campaignType === 'email' && (
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Email Subject
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter subject line..."
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="message-content" className="block text-sm font-medium text-gray-700">
                    {campaignType === 'email' ? 'Email Content' : campaignType === 'sms' ? 'SMS Message' : 'In-App Message Content'}
                  </label>
                  <div className="mt-1">
                    {campaignType === 'email' ? (
                      <textarea
                        id="message-content"
                        rows={10}
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="HTML content supported. You can use {first_name}, {renewal_link}, etc. as variables."
                      />
                    ) : (
                      <textarea
                        id="message-content"
                        rows={4}
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder={`Enter your ${campaignType === 'sms' ? 'SMS' : 'in-app'} message...`}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    You can use the following variables: {'{first_name}'}, {'{last_name}'}, {'{subscription_plan}'}, {'{expiry_date}'}, {'{renewal_link}'}
                  </p>
                </div>
                
                {previewAvailable && (
                  <div className="p-4 border rounded-md bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Message Preview</h3>
                    {campaignType === 'email' ? (
                      <div>
                        <p className="text-sm font-medium">Subject: {subject}</p>
                        <div className="mt-2 p-4 bg-white border rounded-md">
                          <div dangerouslySetInnerHTML={{ __html: messageContent.replace('{first_name}', 'Alex') }} />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white border rounded-md">
                        <p className="text-sm">{messageContent.replace('{first_name}', 'Alex').replace('{link}', 'https://example.com/offer')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link
              href="/admin/marketing/campaigns"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </RouteGuard>
  );
} 