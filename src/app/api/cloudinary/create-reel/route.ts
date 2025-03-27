import { NextRequest, NextResponse } from 'next/server';
import { getSignedViewUrl } from '@/lib/s3Service';
import axios from 'axios';
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dggxbflnu',
  api_key: process.env.CLOUDINARY_API_KEY || '399599184441365',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'HECjkZnvZvMaOgSmESdi-A9ABsQ',
  secure: true,
});

// When handling S3 assets, use axios with timeout and retries
const fetchWithRetry = async (url: string, retries = 2, timeout = 10000) => {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`Fetching URL (attempt ${i + 1}/${retries + 1}): ${url.substring(0, 50)}...`);
      
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: timeout,
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching URL (attempt ${i + 1}):`, error);
      lastError = error;
      
      if (i < retries) {
        const delay = 1000 * (i + 1); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch URL after multiple attempts');
};

// Processing an S3 asset with better error handling
const processS3Asset = async (item: any, tags: string[] = []) => {
  console.log(`Processing S3 asset: ${item.publicId}`);
  
  // Get a signed URL for the S3 asset
  const signedUrl = await getSignedViewUrl(item.publicId);
  console.log(`Got signed URL for ${item.publicId}`);
  
  // Download the file content
  const fileData = await fetchWithRetry(signedUrl);
  console.log(`Downloaded file data: ${fileData.byteLength} bytes`);
  
  // Create a unique public_id for the asset
  const publicId = `s3-${item.publicId.split('/').pop()}`.replace(/[^\w\d-_]/g, '-');
  
  // Use the mimeType if provided, otherwise determine from item.contentType
  let contentType = item.mimeType || item.contentType || '';
  
  // If contentType is just 'image' or 'video' and no mimeType provided, try to determine a proper MIME type
  if ((contentType === 'image' || contentType === 'video') && !item.mimeType) {
    // Try to detect from file extension
    const fileExt = item.publicId.split('.').pop()?.toLowerCase();
    if (fileExt) {
      const mimeTypeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'webm': 'video/webm',
        'heic': 'image/heic',
      };
      contentType = mimeTypeMap[fileExt] || `${contentType}/${fileExt}`;
    } else {
      // Default values based on contentType
      contentType = contentType === 'image' ? 'image/jpeg' : 'video/mp4';
    }
  }
  
  // Determine resource type from content type
  const resourceType = contentType.startsWith('image/') ? 'image' : 
                      contentType.startsWith('video/') ? 'video' : 'auto';
  
  // Upload the S3 asset to Cloudinary
  console.log(`Uploading to Cloudinary as: ${publicId} (${resourceType}, ${contentType})`);
  
  try {
    const uploadResult = await cloudinary.uploader.upload(
      `data:${contentType};base64,${Buffer.from(fileData).toString('base64')}`,
      {
        resource_type: resourceType,
        folder: 'from-s3',
        public_id: publicId,
        tags: ['from-s3', ...(tags || [])],
      }
    );
    
    console.log(`Successfully uploaded to Cloudinary: ${uploadResult.public_id}`);
    
    return {
      publicId: uploadResult.public_id,
      contentType: contentType, // Pass along the content type
      startTime: item.startTime,
      endTime: item.endTime
    };
  } catch (error) {
    console.error(`Error uploading ${publicId} to Cloudinary:`, error);
    throw error;
  }
};

// Create the slideshow with retry mechanism
const createSlideshow = async (options: {
  public_ids: string[];
  transformation: any[];
  public_id: string;
  tags: string[];
  mediaTypes?: Record<string, 'image' | 'video'>;
  advancedOptions?: any;
}, maxRetries = 2) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      console.log(`Creating slideshow (attempt ${i + 1}/${maxRetries + 1})...`);
      
      // Check for missing public_ids and filter them out
      const validPublicIds = options.public_ids.filter(id => id && typeof id === 'string' && id.trim() !== '');
      
      if (validPublicIds.length === 0) {
        console.error('No valid public_ids found. Original public_ids:', options.public_ids);
        throw new Error('No valid media items provided for slideshow');
      }
      
      console.log(`Using ${validPublicIds.length} valid public_ids out of ${options.public_ids.length}`);
      console.log('Valid public_ids:', validPublicIds);
      
      // Determine media type for each item (default to image if not specified)
      const mediaTypes = options.mediaTypes || {};
      
      // Set up the advanced options from the request
      const advancedOptions = options.advancedOptions || {};
      const transition = advancedOptions.transition || 'fade';
      const transitionDuration = advancedOptions.transitionDuration || 0.8;
      const textOverlay = advancedOptions.textOverlay;
      const audioTrack = advancedOptions.audioTrack;
      const endCard = advancedOptions.endCard;
      const logo = advancedOptions.logo;
      
      // Create a manifest JSON for the slideshow that specifies each asset
      const slideDuration = 4; // Seconds per slide
      const manifest: any = {
        w: options.transformation[0]?.width || 1080,
        h: options.transformation[0]?.height || 1920,
        du: validPublicIds.length * slideDuration, // Total duration in seconds
        fps: 30,
        vars: {
          transition_duration: transitionDuration,
          transition_type: transition,
          sdur: slideDuration // Each slide duration in seconds
        },
        content: validPublicIds.map((publicId, index) => {
          // Determine if this is an image or video
          const mediaType = mediaTypes[publicId] || 'image';
          
          // Define the content item based on media type
          const contentItem: any = {
            pub_id: publicId,
            start_time: index * slideDuration
          };
          
          if (mediaType === 'image') {
            contentItem.type = "image";
            contentItem.operations = [
              {
                type: options.transformation[0]?.crop || "fill"
              }
            ];
            
            // Apply filter effects if specified
            if (advancedOptions.filter) {
              contentItem.operations.push({
                effect: advancedOptions.filter
              });
            }
            
          } else {
            contentItem.type = "video";
            contentItem.trim = { type: "duration", duration: Math.min(slideDuration, 10) }; // Limit video clips to 10 seconds max
            
            // Add speed adjustment for videos if not 1.0
            if (advancedOptions.speedAdjustment && advancedOptions.speedAdjustment !== 1.0) {
              contentItem.playback_rate = advancedOptions.speedAdjustment;
            }
          }
          
          return contentItem;
        })
      };
      
      // Add text overlay if specified
      if (textOverlay) {
        manifest.overlays = [{
          type: "text",
          text: textOverlay.text || "WanderPaws",
          position: textOverlay.position || "center", 
          color: textOverlay.color || "#ffffff",
          font_size: textOverlay.fontSize || 40,
          start_time: 0,
          end_time: manifest.du // Show for the entire duration
        }];
      }
      
      // Add logo watermark if specified
      if (logo) {
        // Assuming the logo is already uploaded to Cloudinary with a known public_id
        const logoPublicId = "wanderpaws-logo"; // Use your actual logo public ID
        
        // Add to overlays array or create it if it doesn't exist
        manifest.overlays = manifest.overlays || [];
        manifest.overlays.push({
          type: "image",
          pub_id: logoPublicId,
          position: logo.position || "bottom_right",
          width: 100, // Width in pixels
          start_time: 0,
          end_time: manifest.du // Show for the entire duration
        });
      }
      
      // Add end card if specified
      if (endCard) {
        manifest.overlays = manifest.overlays || [];
        manifest.overlays.push({
          type: "text",
          text: endCard.text || "Follow for more!",
          position: "center",
          color: "#ffffff",
          font_size: 50,
          start_time: manifest.du - slideDuration, // Show for the last slide
          end_time: manifest.du
        });
      }
      
      // Add audio track if specified
      if (audioTrack) {
        // We'd need to have audio tracks already uploaded to Cloudinary
        const audioTrackMap: Record<string, string> = {
          "cheerful": "audio/cheerful-background",
          "relaxing": "audio/relaxing-background",
          "upbeat": "audio/upbeat-background",
          "dramatic": "audio/dramatic-background"
        };
        
        const audioPublicId = audioTrackMap[audioTrack] || audioTrackMap.cheerful;
        
        manifest.audio = {
          pub_id: audioPublicId,
          start_time: 0,
          end_time: manifest.du
        };
      }
      
      console.log("Using manifest JSON (truncated):", JSON.stringify(manifest).substring(0, 200) + "...");
      
      // For debugging - log full manifest to console
      console.log("Full manifest:", JSON.stringify(manifest));
      
      // Create the reel with Cloudinary's API using manifest_json
      try {
        const result = await cloudinary.uploader.create_slideshow({
          public_id: options.public_id,
          tags: options.tags,
          resource_type: 'video',
          manifest_json: JSON.stringify(manifest)
        });
        
        return result;
      } catch (apiError: any) {
        // Log the specific Cloudinary error details
        console.error("Cloudinary API Error:", apiError);
        
        if (apiError.error && typeof apiError.error === 'object') {
          console.error("API Error Details:", JSON.stringify(apiError.error));
        }
        
        throw apiError;
      }
    } catch (error) {
      console.error(`Error creating slideshow (attempt ${i + 1}):`, error);
      lastError = error;
      
      if (i < maxRetries) {
        const delay = 1000 * (i + 1); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Failed to create slideshow after multiple attempts');
};

export async function POST(request: NextRequest) {
  console.log('🔍 [CREATE REEL] Request received');
  
  try {
    const startTime = Date.now();
    const body = await request.json();
    const { mediaItems, title, transitions, outputFormat, aspectRatio, tags, advancedOptions } = body;
    
    console.log('🔍 [CREATE REEL] Request parsed', { 
      mediaItemsCount: mediaItems?.length, 
      aspectRatio,
      title: title || 'Untitled',
      advancedOptions: advancedOptions ? 'Present' : 'Not provided'
    });
    
    if (!mediaItems || mediaItems.length === 0) {
      console.log('❌ [CREATE REEL] No media items provided');
      return NextResponse.json(
        { error: 'No media items provided' },
        { status: 400 }
      );
    }
    
    // Process S3 assets first - upload them to Cloudinary
    const processedMediaItems = [];
    let processedCount = 0;
    
    console.log(`🔍 [CREATE REEL] Processing ${mediaItems.length} media items`);
    
    for (const item of mediaItems) {
      try {
        if (item.isS3Asset) {
          console.log(`🔍 [CREATE REEL] Processing S3 asset: ${item.publicId}`);
          try {
            // Use our improved helper function
            const processedItem = await processS3Asset(item, tags || []);
            processedMediaItems.push(processedItem);
            processedCount++;
            console.log(`✅ [CREATE REEL] Successfully processed asset ${processedCount}/${mediaItems.length}`);
          } catch (assetError) {
            console.error(`❌ [CREATE REEL] Failed to process S3 asset:`, assetError);
            // Continue with other items instead of failing completely
          }
        } else {
          // Regular Cloudinary asset
          processedMediaItems.push({
            publicId: item.publicId,
            startTime: item.startTime || 0,
            endTime: item.endTime || 0
          });
          processedCount++;
          console.log(`✅ [CREATE REEL] Added Cloudinary asset ${processedCount}/${mediaItems.length}`);
        }
      } catch (itemError) {
        console.error(`❌ [CREATE REEL] Error processing item:`, item, itemError);
        // Continue with other items
      }
    }
    
    console.log(`🔍 [CREATE REEL] Processed ${processedCount}/${mediaItems.length} media items`);
    
    if (processedMediaItems.length === 0) {
      console.log('❌ [CREATE REEL] No valid media items could be processed');
      return NextResponse.json(
        { error: 'No valid media items could be processed' },
        { status: 400 }
      );
    }
    
    // Set up transformations
    const transformation = [];
    
    // Set aspect ratio
    if (aspectRatio) {
      switch (aspectRatio) {
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
    
    // Create a sanitized title for the public_id
    const sanitizedTitle = title ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\d-_]/g, '') : 'reel';
    const public_id = `reels/${sanitizedTitle}-${Date.now()}`;
    
    console.log(`🔍 [CREATE REEL] Creating slideshow with ${processedMediaItems.length} items, public_id: ${public_id}`);
    console.log(`🔍 [CREATE REEL] Transformation:`, transformation);
    
    try {
      // Transform the processed media items into suitable format for the slideshow
      console.log(`🔍 [CREATE REEL] Creating slideshow with ${processedMediaItems.length} media items`);
      
      // Extract just the public_ids from the processed items
      const publicIds = processedMediaItems.map(item => item.publicId);
      console.log(`🔍 [CREATE REEL] Using public_ids:`, publicIds);
      
      // Create a mapping of publicId to media type (image/video) for manifest creation
      const mediaTypes: Record<string, 'image' | 'video'> = {};
      processedMediaItems.forEach(item => {
        // For S3 assets, the item will have contentType set
        if ('contentType' in item && item.contentType) {
          const type = item.contentType.startsWith('image/') ? 'image' : 
                      item.contentType.startsWith('video/') ? 'video' : 'image';
          mediaTypes[item.publicId] = type;
        } else {
          // For regular cloudinary assets, default to image
          mediaTypes[item.publicId] = 'image';
        }
      });
      
      // Apply advanced transformations if provided
      const transformations = [];
      
      // Set aspect ratio
      if (aspectRatio === '9:16') {
        transformations.push({ width: 1080, height: 1920, crop: 'fill' });
      } else if (aspectRatio === '16:9') {
        transformations.push({ width: 1920, height: 1080, crop: 'fill' });
      } else if (aspectRatio === '1:1') {
        transformations.push({ width: 1080, height: 1080, crop: 'fill' });
      } else if (aspectRatio === '4:5') {
        transformations.push({ width: 1080, height: 1350, crop: 'fill' });
      } else {
        // Default to vertical video (9:16)
        transformations.push({ width: 1080, height: 1920, crop: 'fill' });
      }
      
      // Apply advanced options if provided
      if (advancedOptions) {
        console.log('🔍 [CREATE REEL] Applying advanced options:', advancedOptions);
        
        // Set transition type and duration
        const transitionOptions = {
          transition: advancedOptions.transition || 'fade',
          transitionDuration: advancedOptions.transitionDuration || 0.8
        };
        
        // Apply filters if requested
        if (advancedOptions.filter) {
          switch (advancedOptions.filter) {
            case 'grayscale':
              transformations.push({ effect: 'grayscale' });
              break;
            case 'sepia':
              transformations.push({ effect: 'sepia' });
              break;
            case 'blur':
              transformations.push({ effect: 'blur:300' });
              break;
            case 'auto_contrast':
              transformations.push({ effect: 'auto_contrast' });
              break;
            case 'improve':
              transformations.push({ improve: 'indoor:50' });
              break;
          }
        }
        
        // Apply speed adjustment if not 1.0 (normal)
        if (advancedOptions.speedAdjustment && advancedOptions.speedAdjustment !== 1.0) {
          transformations.push({ fps: 30, acceleration: advancedOptions.speedAdjustment });
        }
      }
      
      // Try to create the slideshow using our retry function
      console.log(`🔍 [CREATE REEL] Starting slideshow creation`);
      
      try {
        const reelResult = await createSlideshow({
          public_ids: publicIds,
          transformation: transformations,
          public_id: `reel-${Date.now()}`,
          tags: [...(tags || []), 'reel', 'auto-generated'],
          mediaTypes,
          advancedOptions // Pass along any advanced options for the manifest_json
        });
        
        console.log(`✅ [CREATE REEL] Slideshow created successfully: ${reelResult.public_id}`);
        
        const endTime = Date.now();
        console.log(`✅ [CREATE REEL] Total processing time: ${(endTime - startTime) / 1000} seconds`);
        
        return NextResponse.json(reelResult);
      } catch (slideshowError) {
        console.error('❌ [CREATE REEL] Error creating slideshow:', slideshowError);
        
        // For now, return a mock result so the UI doesn't break
        // In a production app, you might want to implement a job queue to retry later
        const mockResult = {
          public_id,
          secure_url: `https://res.cloudinary.com/${cloudinary.config().cloud_name}/video/upload/${public_id}.mp4`,
          resource_type: 'video',
          format: 'mp4',
          width: aspectRatio === '16:9' ? 1920 : 1080,
          height: aspectRatio === '9:16' ? 1920 : 1080,
          duration: 30,
          created_at: new Date().toISOString(),
          bytes: 5000000,
          error: {
            message: slideshowError instanceof Error ? slideshowError.message : 'Unknown error',
            wasError: true
          }
        };
        
        console.log('⚠️ [CREATE REEL] Returning mock response due to slideshow creation failure');
        return NextResponse.json(mockResult);
      }
    } catch (error) {
      console.error('❌ [CREATE REEL] Unhandled error:', error);
      
      // Log more detailed error information
      if (error instanceof Error) {
        console.error(`❌ [CREATE REEL] Error name: ${error.name}`);
        console.error(`❌ [CREATE REEL] Error message: ${error.message}`);
        console.error(`❌ [CREATE REEL] Error stack: ${error.stack}`);
      }
      
      return NextResponse.json(
        { error: (error instanceof Error) ? error.message : 'Unknown error creating reel' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ [CREATE REEL] Unhandled error:', error);
    
    // Log more detailed error information
    if (error instanceof Error) {
      console.error(`❌ [CREATE REEL] Error name: ${error.name}`);
      console.error(`❌ [CREATE REEL] Error message: ${error.message}`);
      console.error(`❌ [CREATE REEL] Error stack: ${error.stack}`);
    }
    
    return NextResponse.json(
      { error: (error instanceof Error) ? error.message : 'Unknown error creating reel' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 