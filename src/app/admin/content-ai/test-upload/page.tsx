'use client';

import { useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [uploadPreset, setUploadPreset] = useState<string>('');
  const [usePreset, setUsePreset] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Only use upload_preset if one is specified and enabled
      if (usePreset && uploadPreset) {
        formData.append('upload_preset', uploadPreset);
      } else {
        // For unsigned uploads without a preset, we need to sign the upload ourselves
        // This often requires server-side code to sign the request
        formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '399599184441365');
      }

      // Upload directly to Cloudinary
      const response = await fetch(`https://api.cloudinary.com/v1_1/dggxbflnu/auto/upload`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Upload success:', result);
        setUploadedUrl(result.secure_url);
      } else {
        console.error('Upload failed:', result);
        setError(`Upload failed: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Upload error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Simple Media Upload Test</h1>
          <Link
            href="/admin/content-ai"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Content Management
          </Link>
        </div>

        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 mb-4"
            >
              Select Media File
            </label>
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Cloudinary Upload Settings</h3>
            <div className="mb-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={usePreset}
                  onChange={() => setUsePreset(!usePreset)}
                  className="rounded border-gray-300 text-primary-600 focus:border-primary-300 focus:ring focus:ring-offset-0 focus:ring-primary-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Use upload preset</span>
              </label>
            </div>
            
            {usePreset && (
              <div className="mb-4">
                <label htmlFor="uploadPreset" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Preset Name
                </label>
                <input
                  type="text"
                  id="uploadPreset"
                  value={uploadPreset}
                  onChange={(e) => setUploadPreset(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your Cloudinary upload preset name"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Create an upload preset in your Cloudinary dashboard under Settings {'->'} Upload
                </p>
                <a 
                  href="https://cloudinary.com/documentation/upload_presets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-xs text-blue-600 hover:underline"
                >
                  Learn more about upload presets
                </a>
              </div>
            )}
            
            {!usePreset && (
              <p className="text-sm text-gray-500">
                Unsigned upload without a preset. This may require additional configuration in your Cloudinary account.
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload to Cloudinary'}
            </button>
          </div>

          {uploadedUrl && (
            <div className="mt-8 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-4">Upload Result</h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">URL:</p>
                <input
                  type="text"
                  value={uploadedUrl}
                  readOnly
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
              </div>
              <div className="aspect-w-16 aspect-h-9 bg-black rounded overflow-hidden">
                {uploadedUrl.includes('/video/') ? (
                  <video
                    src={uploadedUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={uploadedUrl}
                    alt="Uploaded media"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
} 