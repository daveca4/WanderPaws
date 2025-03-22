// Only import and configure cloudinary on the server side
let cloudinary: any;

if (typeof window === 'undefined') {
  // We're on the server
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dggxbflnu',
      api_key: process.env.CLOUDINARY_API_KEY || '399599184441365',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'HECjkZnvZvMaOgSmESdi-A9ABsQ',
      secure: true,
    });
    console.log('Cloudinary configured successfully on server');
  } catch (error) {
    console.error('Cloudinary configuration error:', error);
  }
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface CloudinaryAsset {
  id: string;
  publicId: string;
  url: string;
  format: string;
  type: 'image' | 'video';
  createdAt: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  tags: string[];
}

export interface ReelTemplate {
  id: string;
  name: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5';
  duration: number;
  sections: {
    type: 'intro' | 'main' | 'outro';
    duration: number;
    transition?: string;
  }[];
}

// Upload media to Cloudinary
export const uploadMedia = async (
  file: File,
  options: {
    folder?: string;
    tags?: string[];
    resource_type?: 'image' | 'video' | 'auto';
  } = {}
): Promise<CloudinaryUploadResult> => {
  const { folder = 'wanderpaws', tags = [], resource_type = 'auto' } = options;
  
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'wanderpaws_media');
  formData.append('folder', folder);
  
  if (tags.length > 0) {
    formData.append('tags', tags.join(','));
  }
  
  // Upload to Cloudinary using the upload API
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resource_type}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to upload media to Cloudinary');
  }
  
  return await response.json();
};

// Get a list of assets from Cloudinary
export const getAssets = async (
  options: {
    resourceType?: 'image' | 'video';
    tags?: string[];
    maxResults?: number;
  } = {}
): Promise<CloudinaryAsset[]> => {
  const { resourceType = 'image', tags = [], maxResults = 100 } = options;
  
  try {
    // Server-side only
    if (typeof window === 'undefined' && cloudinary) {
      const result = await cloudinary.api.resources({
        resource_type: resourceType,
        tags: tags.length > 0 ? tags : undefined,
        max_results: maxResults,
        type: 'upload',
      });
      
      return result.resources.map((resource: any) => ({
        id: resource.asset_id,
        publicId: resource.public_id,
        url: resource.secure_url,
        format: resource.format,
        type: resource.resource_type,
        createdAt: resource.created_at,
        fileSize: resource.bytes,
        width: resource.width,
        height: resource.height,
        duration: resource.duration,
        tags: resource.tags || [],
      }));
    } else {
      // Client-side - use the API endpoint
      const queryParams = new URLSearchParams();
      queryParams.set('resourceType', resourceType);
      
      if (tags.length > 0) {
        queryParams.set('tags', tags.join(','));
      }
      
      queryParams.set('maxResults', maxResults.toString());
      
      try {
        const response = await fetch(`/api/cloudinary/assets?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch assets from API');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching assets from API:', error);
        return [];
      }
    }
  } catch (error) {
    console.error('Error fetching assets from Cloudinary:', error);
    return [];
  }
};

// Create a new video/reel from multiple media items
export const createReel = async (
  options: {
    mediaItems: { publicId: string; startTime?: number; endTime?: number }[];
    title: string;
    template?: ReelTemplate;
    transitions?: string[];
    outputFormat?: 'mp4' | 'webm';
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5';
    tags?: string[];
  }
): Promise<CloudinaryUploadResult> => {
  try {
    // Set up transformations
    const transformation = [];
    
    // Set aspect ratio
    if (options.aspectRatio) {
      switch (options.aspectRatio) {
        case '1:1':
          transformation.push({ width: 1080, height: 1080, crop: 'fill' });
          break;
        case '16:9':
          transformation.push({ width: 1920, height: 1080, crop: 'fill' });
          break;
        case '9:16':
          transformation.push({ width: 1080, height: 1920, crop: 'fill' });
          break;
        case '4:5':
          transformation.push({ width: 1080, height: 1350, crop: 'fill' });
          break;
      }
    }
    
    // Client-side - use the API endpoint with retry mechanism
    const maxRetries = 2;
    let retryCount = 0;
    let lastError;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`Creating reel - attempt ${retryCount + 1} of ${maxRetries + 1}`);
        
        const response = await fetch('/api/cloudinary/create-reel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...options,
            // Add indicator if the media items are from S3 vs Cloudinary
            mediaItems: options.mediaItems.map(item => ({
              ...item,
              // Add a flag to indicate if this is an S3 asset (publicId contains no slashes)
              isS3Asset: !item.publicId.includes('/') && !item.publicId.startsWith('sample-')
            }))
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`API error (${response.status}): ${errorData.error || errorData.message || 'Unknown error'}`);
        }
        
        // If successful, return the result
        return await response.json();
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        lastError = error;
        retryCount++;
        
        if (retryCount <= maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    
    // If we're here, all retries failed
    throw lastError || new Error('Failed to create reel after multiple attempts');
  } catch (error) {
    console.error('Error creating reel:', error);
    throw error;
  }
};

// Get pre-built reel templates - safe for both client and server
export const getReelTemplates = (): ReelTemplate[] => {
  // This function returns hard-coded data, so it's safe for browser execution
  return [
    {
      id: 'instagram-story',
      name: 'Instagram Story',
      aspectRatio: '9:16',
      duration: 15,
      sections: [
        { type: 'intro', duration: 3, transition: 'fade' },
        { type: 'main', duration: 10 },
        { type: 'outro', duration: 2, transition: 'fade' },
      ],
    },
    {
      id: 'tiktok-vertical',
      name: 'TikTok Video',
      aspectRatio: '9:16',
      duration: 30,
      sections: [
        { type: 'intro', duration: 3, transition: 'slide' },
        { type: 'main', duration: 24 },
        { type: 'outro', duration: 3, transition: 'fade' },
      ],
    },
    {
      id: 'instagram-reel',
      name: 'Instagram Reel',
      aspectRatio: '9:16',
      duration: 30,
      sections: [
        { type: 'intro', duration: 3, transition: 'zoom' },
        { type: 'main', duration: 24 },
        { type: 'outro', duration: 3, transition: 'fade' },
      ],
    },
    {
      id: 'facebook-square',
      name: 'Facebook Square',
      aspectRatio: '1:1',
      duration: 60,
      sections: [
        { type: 'intro', duration: 5, transition: 'fade' },
        { type: 'main', duration: 50 },
        { type: 'outro', duration: 5, transition: 'fade' },
      ],
    },
  ];
};

// Apply filter/effect to media - with browser safety check
export const applyEffect = (publicId: string, effect: string): string => {
  if (typeof window !== 'undefined' || !cloudinary) {
    // For client side, return mock URL or original
    console.warn('applyEffect called from client side - returning mock URL');
    return `https://res.cloudinary.com/dggxbflnu/image/upload/e_${effect}/${publicId}`;
  }
  
  return cloudinary.url(publicId, {
    transformation: [{ effect }],
  });
}; 