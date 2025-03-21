import { 
  S3Client, 
  ListObjectsV2Command, 
  HeadObjectCommand,
  S3ClientConfig,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';

export interface S3UploadResult {
  key: string;
  location: string;
  bucket: string;
  etag: string;
  contentType: string;
}

export interface S3Asset {
  id: string;
  key: string; 
  url: string;
  contentType: string;
  size: number;
  uploaded: string;
  walkId?: string;
  tags?: string[];
}

// Helper function to attempt HEIC conversion (will only run if heic-convert is available)
const tryConvertHeicToJpeg = async (file: File): Promise<File | null> => {
  // Only process HEIC files
  if (!file.name.toLowerCase().endsWith('.heic')) {
    return null;
  }
  
  try {
    // Check if we can use the File API to create a new file with a different extension
    const fileName = file.name.replace(/\.heic$/i, '.jpg');
    
    // Create a canvas to convert the image (this is a basic conversion)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Create an image element and load the HEIC file
    const img = document.createElement('img');
    
    // Create a promise that resolves when the image is loaded
    const imageLoaded = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Set a data URL for the image (this may not work for HEIC directly)
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
    
    // Try to load and convert the image
    try {
      const loadedImg = await imageLoaded;
      
      // Set canvas dimensions
      canvas.width = loadedImg.width;
      canvas.height = loadedImg.height;
      
      // Draw the image on the canvas
      ctx.drawImage(loadedImg, 0, 0);
      
      // Convert canvas to blob with JPEG format
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else resolve(new Blob([]));
        }, 'image/jpeg', 0.85); // 85% quality
      });
      
      // Create a new file from the blob
      return new File([blob], fileName, { type: 'image/jpeg' });
    } catch (e) {
      console.warn('Image conversion failed:', e);
      return null;
    }
  } catch (e) {
    console.warn('HEIC conversion failed:', e);
    return null;
  }
};

// Configure AWS S3
let s3Client: S3Client;

if (typeof window === 'undefined') {
  // Server-side configuration
  const s3Config: S3ClientConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
  };
  
  s3Client = new S3Client(s3Config);
}

// Generate a pre-signed URL for uploading directly to S3
export const getPresignedUploadUrl = async (
  fileName: string,
  contentType: string,
  options: {
    prefix?: string;
    maxSize?: number;
    expiration?: number;
    metadata?: Record<string, string>;
  } = {}
): Promise<{ uploadUrl: string; key: string; fields?: Record<string, string> }> => {
  // Ensure we're on the server
  if (typeof window !== 'undefined') {
    const response = await fetch('/api/s3/presigned-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, contentType, ...options }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get presigned URL');
    }
    
    return await response.json();
  }
  
  // Server-side implementation
  const { 
    prefix = '',
    maxSize = 100 * 1024 * 1024, // 100MB default max size
    expiration = 60 * 15, // 15 minutes
    metadata = {}
  } = options;
  
  // Generate a unique key for the file using a timestamp prefix
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Create key based on whether a prefix is provided
  const key = prefix 
    ? `${prefix}/${timestamp}-${sanitizedName}` 
    : `${timestamp}-${sanitizedName}`;
  
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'wanderpaws-media';
  
  // Create the command for the operation
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    Metadata: metadata,
  });

  // Generate the presigned URL
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiration,
  });
  
  return {
    uploadUrl,
    key,
    // Note: fields are not needed with this approach, 
    // as we're using a direct PUT request rather than a form POST
  };
};

// Upload a file directly to S3 from client-side
export const uploadFileToS3 = async (
  file: File,
  options: {
    walkId?: string;
    tags?: string[];
    prefix?: string;
  } = {}
): Promise<S3UploadResult> => {
  // Change default prefix to empty string to store in root of bucket
  const { walkId, tags = [], prefix = '' } = options;
  
  try {
    // Check file size - 50MB limit for images, 100MB for videos
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSizeInMB = (maxSize / 1024 / 1024).toFixed(0);
      throw new Error(`File too large: ${file.name} is ${sizeInMB}MB (max ${maxSizeInMB}MB)`);
    }
    
    // Normalize content type for HEIC and other Apple-specific formats
    let contentType = file.type;
    const fileName = file.name.toLowerCase();
    
    // Fix HEIC content type if browser doesn't recognize it correctly
    if (fileName.endsWith('.heic') && (!contentType || contentType === 'image/heic' || contentType === 'application/octet-stream')) {
      contentType = 'image/heic';
    }
    
    // Fix QuickTime/MOV content type
    if (fileName.endsWith('.mov') && (!contentType || contentType === 'application/octet-stream')) {
      contentType = 'video/quicktime';
    }
    
    console.log(`Uploading ${fileName} with content type: ${contentType}`);
    
    // Get a presigned URL
    const response = await fetch('/api/s3/presigned-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: contentType, // Use normalized content type
        prefix,
        metadata: {
          walkId: walkId || '',
          tags: tags.join(','),
        },
      }),
      // Add timeout for the presigned URL request
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    }).catch(err => {
      if (err.name === 'AbortError') {
        throw new Error('Request for upload permission timed out');
      }
      throw new Error(`Network error: ${err.message}`);
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.status} ${response.statusText}`);
    }
    
    const { uploadUrl, key } = await response.json();
    
    // First try to upload with the original file and type
    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: file,
        signal: AbortSignal.timeout(120000), // 2 minutes timeout
      }).catch(err => {
        if (err.name === 'AbortError') {
          throw new Error(`Upload timed out. The file may be too large: ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`);
        }
        
        // Specifically handle the Failed to fetch error
        if (err.message.includes('Failed to fetch')) {
          throw new Error(`Network error: The upload was interrupted. This could be due to network instability or CORS issues.`);
        }
        
        throw new Error(`Network error during upload: ${err.message}`);
      });
      
      if (uploadResponse.ok) {
        // Original upload succeeded
        return {
          key,
          location: `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`,
          bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'wanderpaws-media',
          etag: uploadResponse.headers.get('ETag') || '',
          contentType,
        };
      }
      
      // If we get here, the original upload failed but didn't throw an error
      console.warn(`Upload failed with status: ${uploadResponse.status}. Trying fallback...`);
    } catch (uploadError) {
      console.warn('Initial upload attempt failed:', uploadError);
      
      // For HEIC files, try conversion as fallback
      if (fileName.endsWith('.heic')) {
        console.log('Attempting HEIC conversion fallback...');
        
        // Try to convert HEIC to JPEG
        const convertedFile = await tryConvertHeicToJpeg(file);
        if (convertedFile) {
          console.log('HEIC conversion successful, uploading as JPEG');
          
          // Get a new presigned URL for the converted file
          const jpegResponse = await fetch('/api/s3/presigned-upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: convertedFile.name,
              contentType: 'image/jpeg',
              prefix,
              metadata: {
                walkId: walkId || '',
                tags: [...tags, 'converted-from-heic'].join(','),
              },
            }),
          });
          
          if (jpegResponse.ok) {
            const { uploadUrl: jpegUploadUrl, key: jpegKey } = await jpegResponse.json();
            
            // Upload the converted JPEG file
            const jpegUploadResponse = await fetch(jpegUploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'image/jpeg',
              },
              body: convertedFile,
            });
            
            if (jpegUploadResponse.ok) {
              return {
                key: jpegKey,
                location: `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${jpegKey}`,
                bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || 'wanderpaws-media',
                etag: jpegUploadResponse.headers.get('ETag') || '',
                contentType: 'image/jpeg',
              };
            }
          }
        }
      }
      
      // If fallback failed or wasn't attempted, re-throw the original error
      throw uploadError;
    }
    
    // If we reached here, neither the original upload nor any fallbacks worked
    throw new Error(`Failed to upload file: unknown error`);
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload ${file.name}: ${error.message}`);
    } else {
      throw new Error(`Failed to upload ${file.name}: Unknown error`);
    }
  }
};

// Get assets from S3
export const getS3Assets = async (
  options: {
    prefix?: string;
    walkId?: string;
    maxResults?: number;
  } = {}
): Promise<S3Asset[]> => {
  const { prefix = '', walkId, maxResults = 100 } = options;
  
  try {
    // Use the API route on client-side
    if (typeof window !== 'undefined') {
      const queryParams = new URLSearchParams();
      
      if (prefix) queryParams.set('prefix', prefix);
      if (walkId) queryParams.set('walkId', walkId);
      if (maxResults) queryParams.set('maxResults', maxResults.toString());
      
      console.log(`Fetching assets from /api/s3/assets?${queryParams.toString()}`);
      const response = await fetch(`/api/s3/assets?${queryParams.toString()}`);
      
      if (!response.ok) {
        console.error(`Failed to fetch assets: ${response.status} ${response.statusText}`);
        throw new Error('Failed to fetch assets from API');
      }
      
      const assets = await response.json();
      console.log(`Retrieved ${assets.length} assets from API`);
      
      // Sort assets by upload date, newest first
      return assets.sort((a: S3Asset, b: S3Asset) => {
        return new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime();
      });
    }
    
    // Server-side implementation
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'wanderpaws-media';
    
    // Create and execute the ListObjectsV2 command
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: maxResults,
    });
    
    const listResult = await s3Client.send(command);
    
    if (!listResult.Contents || listResult.Contents.length === 0) {
      return [];
    }
    
    // Transform to our S3Asset format
    const assets: S3Asset[] = listResult.Contents.map(item => {
      const key = item.Key || '';
      const url = `https://${bucketName}.s3.amazonaws.com/${key}`;
      
      return {
        id: item.ETag?.replace(/"/g, '') || key,
        key,
        url,
        contentType: getContentTypeFromKey(key),
        size: item.Size || 0,
        uploaded: item.LastModified?.toISOString() || new Date().toISOString(),
      };
    });
    
    // If walkId is provided, filter by walkId using Head requests to check metadata
    if (walkId) {
      const filteredAssets = [];
      
      for (const asset of assets) {
        try {
          // Create and execute the HeadObject command
          const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: asset.key,
          });
          
          const headResult = await s3Client.send(headCommand);
          
          if (headResult.Metadata?.walkid === walkId) {
            // Add walkId and tags from metadata
            filteredAssets.push({
              ...asset,
              walkId,
              tags: headResult.Metadata?.tags?.split(',') || [],
            });
          }
        } catch (error) {
          console.error(`Error getting metadata for ${asset.key}:`, error);
        }
      }
      
      // Sort by upload date, newest first
      return filteredAssets.sort((a, b) => {
        return new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime();
      });
    }
    
    // Sort by upload date, newest first
    return assets.sort((a, b) => {
      return new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime();
    });
  } catch (error) {
    console.error('Error fetching assets from S3:', error);
    return [];
  }
};

// Helper function to determine content type from file extension
const getContentTypeFromKey = (key: string): string => {
  const ext = key.split('.').pop()?.toLowerCase() || '';
  
  const contentTypeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'webm': 'video/webm',
  };
  
  return contentTypeMap[ext] || 'application/octet-stream';
};

// Helper function to get thumbnail URL
export const getThumbnailUrl = (asset: S3Asset, size: 'small' | 'medium' | 'large' = 'medium'): string => {
  // Return original URL if not image or video
  if (!asset.contentType.startsWith('image/') && !asset.contentType.startsWith('video/')) {
    return asset.url;
  }
  
  // Check if the URL is from S3
  if (!asset.url.includes('.s3.')) {
    return asset.url;
  }
  
  // Dimensions based on size
  const dimensions = {
    small: '150x150',
    medium: '300x300',
    large: '600x600'
  };
  
  // Create a thumbnail URL using URL parameters for on-the-fly processing
  // This assumes you have set up a CloudFront distribution with Lambda@Edge or similar
  // to handle image resizing based on URL parameters
  try {
    // Parse the S3 URL
    const url = new URL(asset.url);
    
    // For actual implementation:
    // 1. Set up AWS CloudFront with Lambda@Edge for image resizing
    // 2. Use query parameters to specify resize dimensions
    // 3. Return a CloudFront URL instead
    
    // Example of what this might look like with CloudFront:
    // return `https://your-cloudfront-domain.com/${asset.key}?width=${width}&height=${height}&fit=cover`;
    
    // For now, we'll just return the original URL since the infrastructure isn't set up
    // In a real implementation, replace this with CloudFront URL generation
    
    // Simulate a thumbnail URL - this won't actually resize the image
    // but shows how the URL structure might look
    url.searchParams.set('resize', dimensions[size]);
    return url.toString();
  } catch (e) {
    console.warn('Error generating thumbnail URL:', e);
    return asset.url;
  }
};

// For server-side thumbnail generation
export const generateThumbnail = async (assetKey: string): Promise<string | null> => {
  // This would be implemented server-side using AWS Lambda
  // For now, we'll just return null to indicate it's not implemented
  
  // Example of what this would do in a real implementation:
  // 1. Trigger an AWS Lambda function to generate a thumbnail
  // 2. Store the thumbnail in S3 with a prefix like 'thumbnails/'
  // 3. Return the URL of the generated thumbnail
  
  console.log('Thumbnail generation for', assetKey, 'would happen server-side');
  return null;
}; 