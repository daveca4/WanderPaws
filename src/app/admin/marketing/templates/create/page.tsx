'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';

// Template types and categories
const templateTypes = ['email', 'sms'];
const templateCategories = ['onboarding', 'retention', 'engagement', 'promotion', 'transactional'];

// Initial form state
const initialFormState = {
  name: '',
  description: '',
  type: 'email',
  category: '',
  subject: '',
  content: '',
  senderName: '',
  senderEmail: '',
  preheader: ''
};

export default function CreateTemplatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState(initialFormState);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError('Template name is required');
      return false;
    }

    if (!formData.category) {
      setFormError('Please select a category');
      return false;
    }

    if (formData.type === 'email' && !formData.subject.trim()) {
      setFormError('Email subject is required');
      return false;
    }

    if (!formData.content.trim()) {
      setFormError('Template content is required');
      return false;
    }

    if (formData.type === 'email') {
      if (!formData.senderName.trim()) {
        setFormError('Sender name is required for email templates');
        return false;
      }
      
      if (!formData.senderEmail.trim()) {
        setFormError('Sender email is required for email templates');
        return false;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.senderEmail)) {
        setFormError('Please enter a valid email address');
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
      
      // In a real app, this would make an API call to create the template
      console.log('Creating template with data:', formData);
      
      // Redirect to templates management page after successful creation
      router.push('/admin/marketing/templates');
    } catch (error) {
      console.error('Error creating template:', error);
      setFormError('Failed to create template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Email preview component
  const EmailPreview = () => {
    if (formData.type !== 'email') return null;
    
    return (
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700">From: {formData.senderName} &lt;{formData.senderEmail}&gt;</p>
              <p className="text-sm font-medium text-gray-700">Subject: {formData.subject || 'No subject'}</p>
              <p className="text-xs text-gray-500">{formData.preheader || 'No preheader'}</p>
            </div>
            <button
              type="button"
              onClick={togglePreview}
              className="text-sm text-primary-600"
            >
              Back to Editor
            </button>
          </div>
        </div>
        <div className="bg-white p-6">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: formData.content.replace(/\n/g, '<br>') }}
          />
        </div>
      </div>
    );
  };

  // SMS preview component
  const SmsPreview = () => {
    if (formData.type !== 'sms') return null;
    
    return (
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
          <p className="text-sm font-medium text-gray-700">SMS Preview</p>
          <button
            type="button"
            onClick={togglePreview}
            className="text-sm text-primary-600"
          >
            Back to Editor
          </button>
        </div>
        <div className="bg-white p-6">
          <div className="max-w-sm mx-auto bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-800">{formData.content || 'No content'}</p>
            <p className="text-xs text-gray-500 text-right mt-2">
              {Math.ceil((formData.content.length || 0) / 160)} SMS segment(s)
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'marketing_templates' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Template</h1>
            <p className="mt-1 text-sm text-gray-500">
              Design a reusable template for your marketing communications
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Link
              href="/admin/marketing/templates"
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

        {previewMode ? (
          <div>
            {formData.type === 'email' ? <EmailPreview /> : <SmsPreview />}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Template Information
                </h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Template Name</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g., Welcome Email"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">Template Type</label>
                    <div className="mt-1">
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        {templateTypes.map(type => (
                          <option key={type} value={type}>{type.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                    <div className="mt-1">
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select Category</option>
                        {templateCategories.map(category => (
                          <option key={category} value={category} className="capitalize">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={2}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                        placeholder="Describe the purpose of this template"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {formData.type === 'email' && (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Email Settings
                  </h2>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                    <div>
                      <label htmlFor="senderName" className="block text-sm font-medium text-gray-700">Sender Name</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="senderName"
                          id="senderName"
                          value={formData.senderName}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="e.g., WanderPaws Team"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="senderEmail" className="block text-sm font-medium text-gray-700">Sender Email</label>
                      <div className="mt-1">
                        <input
                          type="email"
                          name="senderEmail"
                          id="senderEmail"
                          value={formData.senderEmail}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="e.g., support@wanderpaws.com"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject Line</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="subject"
                          id="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="e.g., Welcome to WanderPaws!"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label htmlFor="preheader" className="block text-sm font-medium text-gray-700">
                        Preheader
                        <span className="ml-1 text-xs text-gray-500">(optional)</span>
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="preheader"
                          id="preheader"
                          value={formData.preheader}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="A brief summary that appears after the subject line in email clients"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        This text will appear in the inbox preview of most email clients.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  {formData.type === 'email' ? 'Email Content' : 'Message Content'}
                </h2>
                <button
                  type="button"
                  onClick={togglePreview}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Preview
                </button>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {formData.type === 'email' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Enter the content of your email below. You can use plain text or HTML.
                    </p>
                    <textarea
                      name="content"
                      id="content"
                      rows={12}
                      value={formData.content}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md font-mono"
                      placeholder="<p>Hello {{name}},</p><p>Welcome to WanderPaws!</p>"
                    />
                    <p className="text-xs text-gray-500">
                      Tip: Use {'{{variableName}}'} syntax to insert personalized variables in your template.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Enter the content of your SMS message below.
                    </p>
                    <textarea
                      name="content"
                      id="content"
                      rows={5}
                      value={formData.content}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Hello {{name}}, welcome to WanderPaws! Your account has been created successfully."
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        Tip: Keep your messages concise. Standard SMS length is 160 characters.
                      </p>
                      <p className="text-xs font-medium text-gray-700">
                        Characters: {formData.content.length} 
                        <span className="ml-2">
                          ({Math.ceil(formData.content.length / 160)} SMS segment{Math.ceil(formData.content.length / 160) !== 1 ? 's' : ''})
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/admin/marketing/templates"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </form>
        )}
      </div>
    </RouteGuard>
  );
} 