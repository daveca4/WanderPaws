import { ContentItem } from './contentAIService';

// Define types for social media platform credentials
export interface InstagramCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  userId?: string;
  connectedUsername?: string;
  enabledFeatures?: {
    feed: boolean;
    stories: boolean;
    reels: boolean;
  };
}

export interface FacebookCredentials {
  appId: string;
  appSecret: string;
  accessToken?: string;
  pageId?: string;
  pageName?: string;
  enabledFeatures?: {
    posts: boolean;
    reels: boolean;
    stories: boolean;
  };
}

export interface TikTokCredentials {
  clientKey: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  accountId?: string;
  username?: string;
}

export interface SocialMediaSettings {
  autoPost: boolean;
  crossPosting: boolean;
  platformAdaptation: boolean;
}

export interface SocialMediaConfig {
  instagram?: InstagramCredentials;
  facebook?: FacebookCredentials;
  tiktok?: TikTokCredentials;
  settings: SocialMediaSettings;
}

// Mock data for connected accounts
let socialMediaConfig: SocialMediaConfig = {
  instagram: {
    apiKey: 'igkf_1234567890abcdef',
    apiSecret: 'igs_9876543210fedcba',
    accessToken: 'IGQWROnJ5dGFic1pGV2dpRVlVLWZAXcUZAoTWNOS0lnYXR2dnY4SjlHTE1yZAk1aeC1PZA252THctOEs1VnlnbTFqdXpFaElyd3I2U3VrM2JFd09SWnFyYjQ0Vl80aHBUSUpUaVhFVUNn',
    userId: '17895463210987654',
    connectedUsername: 'wanderpaws_official',
    enabledFeatures: {
      feed: true,
      stories: true,
      reels: true
    }
  },
  facebook: {
    appId: '123456789012345',
    appSecret: 'abcdef1234567890abcdef',
    accessToken: 'EAAJKqZA2YZCm4BAJVdSe1q2vLEuiZBQnFoFnTNZCgVm4KuZANWg7bD9TQzWdjzORZAQ6iB1yjcqrH0S1ZBtGj2xRj5kQtM8wQrhZCVuNbsLnZCZC2JbZBMckfZBN18PEHqgB9XZC0JEBmGHZAgAIZBkFwpSzjvxZCdCFkFl1M2ixRlpfYWQ',
    pageId: '123456789012345',
    pageName: 'WanderPaws',
    enabledFeatures: {
      posts: true,
      reels: true,
      stories: false
    }
  },
  tiktok: undefined,
  settings: {
    autoPost: false,
    crossPosting: true,
    platformAdaptation: true
  }
};

/**
 * Get all social media configurations
 */
export const getSocialMediaConfig = (): Promise<SocialMediaConfig> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({...socialMediaConfig});
    }, 500);
  });
};

/**
 * Update social media configuration
 */
export const updateSocialMediaConfig = (config: Partial<SocialMediaConfig>): Promise<SocialMediaConfig> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      socialMediaConfig = {
        ...socialMediaConfig,
        ...config,
        // Merge nested objects instead of replacing them
        instagram: config.instagram ? {...socialMediaConfig.instagram, ...config.instagram} : socialMediaConfig.instagram,
        facebook: config.facebook ? {...socialMediaConfig.facebook, ...config.facebook} : socialMediaConfig.facebook,
        tiktok: config.tiktok ? {...socialMediaConfig.tiktok, ...config.tiktok} : socialMediaConfig.tiktok,
        settings: config.settings ? {...socialMediaConfig.settings, ...config.settings} : socialMediaConfig.settings
      };
      resolve({...socialMediaConfig});
    }, 500);
  });
};

/**
 * Connect to Instagram
 * @param credentials The credentials to connect with
 */
export const connectInstagram = (credentials: Partial<InstagramCredentials>): Promise<InstagramCredentials> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Ensure required fields are present
      if (!credentials.apiKey || !credentials.apiSecret) {
        throw new Error('API Key and Secret are required');
      }
      
      const updatedCredentials: InstagramCredentials = {
        apiKey: credentials.apiKey,
        apiSecret: credentials.apiSecret,
        ...credentials,
        // Mock successful connection with generated tokens
        accessToken: 'IGQWROnJ5dGFic1pGV2dpRVlVLWZAXcUZAoTWNOS0lnYXR2dnY4SjlHTE1yZAk1aeC1PZA252THctOEs1VnlnbTFqdXpFaElyd3I2U3VrM2JFd09SWnFyYjQ0Vl80aHBUSUpUaVhFVUNn',
        userId: '17895463210987654',
        connectedUsername: 'wanderpaws_official'
      };

      // Update the global config
      socialMediaConfig.instagram = updatedCredentials;
      
      resolve(updatedCredentials);
    }, 1000);
  });
};

/**
 * Connect to Facebook
 * @param credentials The credentials to connect with
 */
export const connectFacebook = (credentials: Partial<FacebookCredentials>): Promise<FacebookCredentials> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Ensure required fields are present
      if (!credentials.appId || !credentials.appSecret) {
        throw new Error('App ID and Secret are required');
      }
      
      const updatedCredentials: FacebookCredentials = {
        appId: credentials.appId,
        appSecret: credentials.appSecret,
        ...credentials,
        // Mock successful connection with generated tokens
        accessToken: 'EAAJKqZA2YZCm4BAJVdSe1q2vLEuiZBQnFoFnTNZCgVm4KuZANWg7bD9TQzWdjzORZAQ6iB1yjcqrH0S1ZBtGj2xRj5kQtM8wQrhZCVuNbsLnZCZC2JbZBMckfZBN18PEHqgB9XZC0JEBmGHZAgAIZBkFwpSzjvxZCdCFkFl1M2ixRlpfYWQ',
        pageId: '123456789012345',
        pageName: 'WanderPaws'
      };

      // Update the global config
      socialMediaConfig.facebook = updatedCredentials;
      
      resolve(updatedCredentials);
    }, 1000);
  });
};

/**
 * Connect to TikTok
 * @param credentials The credentials to connect with
 */
export const connectTikTok = (credentials: TikTokCredentials): Promise<TikTokCredentials> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const updatedCredentials: TikTokCredentials = {
        ...credentials,
        // Mock successful connection with generated tokens
        accessToken: 'act.fsjdSSDf235ljfk-JSDFdsf9-FSDFJKsd0fsdfk203jsdfSDFKSDLK',
        refreshToken: 'rft.sdflkSD34lFSDFJl30DfsdflKSD0FSDFJ0323lksdSDFSDFSDLK',
        accountId: '6234567890123456789',
        username: 'wanderpaws'
      };

      // Update the global config
      socialMediaConfig.tiktok = updatedCredentials;
      
      resolve(updatedCredentials);
    }, 1000);
  });
};

/**
 * Disconnect from a social media platform
 * @param platform The platform to disconnect from
 */
export const disconnectPlatform = (platform: 'instagram' | 'facebook' | 'tiktok'): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (platform === 'instagram') {
        socialMediaConfig.instagram = undefined;
      } else if (platform === 'facebook') {
        socialMediaConfig.facebook = undefined;
      } else if (platform === 'tiktok') {
        socialMediaConfig.tiktok = undefined;
      }
      
      resolve(true);
    }, 500);
  });
};

/**
 * Post content to social media
 * @param content The content to post
 * @param platforms The platforms to post to
 */
export const postToSocialMedia = (
  content: ContentItem, 
  platforms: ('instagram' | 'facebook' | 'tiktok')[]
): Promise<{
  success: boolean;
  platforms: Record<string, {
    success: boolean;
    postId?: string;
    error?: string;
  }>
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock response for successful posting
      const result: {
        success: boolean;
        platforms: Record<string, {
          success: boolean;
          postId?: string;
          error?: string;
        }>
      } = {
        success: true,
        platforms: platforms.reduce((acc, platform) => {
          acc[platform] = {
            success: true,
            postId: `${platform}_${Math.floor(Math.random() * 1000000)}`
          };
          return acc;
        }, {} as Record<string, { success: boolean; postId?: string; error?: string; }>)
      };
      
      resolve(result);
    }, 2000);
  });
};

/**
 * Schedule content for social media
 * @param content The content to schedule
 * @param platforms The platforms to schedule for
 * @param scheduledTime The time to schedule the post
 */
export const scheduleForSocialMedia = (
  content: ContentItem, 
  platforms: ('instagram' | 'facebook' | 'tiktok')[],
  scheduledTime: string
): Promise<{
  success: boolean;
  scheduleId: string;
  platforms: Record<string, {
    success: boolean;
    scheduleId?: string;
    error?: string;
  }>
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock response for successful scheduling
      const scheduleId = `schedule_${Math.floor(Math.random() * 1000000)}`;
      const result: {
        success: boolean;
        scheduleId: string;
        platforms: Record<string, {
          success: boolean;
          scheduleId?: string;
          error?: string;
        }>
      } = {
        success: true,
        scheduleId,
        platforms: platforms.reduce((acc, platform) => {
          acc[platform] = {
            success: true,
            scheduleId: `${platform}_${scheduleId}`
          };
          return acc;
        }, {} as Record<string, { success: boolean; scheduleId?: string; error?: string; }>)
      };
      
      resolve(result);
    }, 1500);
  });
}; 