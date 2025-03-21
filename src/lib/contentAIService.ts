import { v4 as uuidv4 } from 'uuid';

export type ContentType = 'blog' | 'social' | 'email' | 'announcement' | 'video' | 'reel';
export type ContentStatus = 'draft' | 'published' | 'scheduled';

export interface MediaAsset {
  id: string;
  publicId: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  format: string;
  duration?: number;
  width?: number; 
  height?: number;
}

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  type: ContentType;
  createdAt: string;
  updatedAt: string;
  status: ContentStatus;
  scheduledFor?: string;
  author: string;
  tags: string[];
  summary?: string;
  mediaAssets?: MediaAsset[];
  thumbnailUrl?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5';
  duration?: number;
  socialPlatforms?: ('instagram' | 'facebook' | 'tiktok')[];
}

export interface ContentGenerationOptions {
  contentType: ContentType;
  tone: string;
  topic: string;
  targetAudience: string;
  keywords: string;
  length: string;
  prompt?: string;
  mediaAssets?: MediaAsset[];
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5';
  targetDuration?: number;
  template?: string;
  textOverlay?: boolean;
  musicType?: string;
  transitionStyle?: string;
  captionsRequired?: boolean;
}

export interface PromptResponseItem {
  content: string;
  score: number; // Quality score for this generated content
}

// Mock content items
let contentItems: ContentItem[] = [
  {
    id: '1',
    title: 'Top 10 Dog Walking Tips for Summer',
    content: `# Top 10 Dog Walking Tips for Summer\n\nAs temperatures rise, it's crucial to keep your furry friend safe and comfortable during walks. At WanderPaws, we understand the importance of maintaining your dog's exercise routine while protecting them from summer hazards.\n\n## 1. Time Your Walks Wisely\n\nEarly morning or evening walks are ideal during summer months. The pavement is cooler, and the temperature is more comfortable for your dog. Avoid walking between 10 AM and 4 PM when the sun is at its strongest.\n\n## 2. Check the Pavement Temperature\n\nBefore heading out, place your hand on the pavement for 7 seconds. If it's too hot for your hand, it's too hot for your dog's paws. Consider using protective booties or stick to grassy areas.\n\n## 3. Bring Plenty of Water\n\nAlways carry fresh water and a portable bowl. Offer water breaks every 15-20 minutes, especially on hot days.\n\n## 4. Know the Signs of Heatstroke\n\nBe alert for symptoms like excessive panting, drooling, bright red gums, vomiting, or collapse. Heatstroke requires immediate veterinary attention.\n\n## 5. Apply Dog-Safe Sunscreen\n\nDogs with short hair, pink skin, or white fur are susceptible to sunburn. Apply pet-safe sunscreen to exposed areas like the nose, ears, and belly.\n\n## 6. Keep Walks Shorter\n\nHot weather calls for shorter, more frequent walks rather than one long excursion. Monitor your dog's energy level and head home if they seem uncomfortable.\n\n## 7. Stay Hydrated Together\n\nBoth you and your dog need proper hydration. Drink water before, during, and after walks.\n\n## 8. Choose Shaded Routes\n\nPlan walks that offer plenty of shade from trees or buildings. Avoid open areas with no escape from the sun.\n\n## 9. Consider Cooling Accessories\n\nCooling vests, bandanas, and mats can help regulate your dog's temperature during and after walks.\n\n## 10. Listen to Your Dog\n\nYour dog will let you know when they've had enough. Pay attention to signals like slowing down, panting heavily, or seeking shade.\n\nAt WanderPaws, our professional dog walkers are trained to keep your pets safe in all weather conditions. Contact us today to learn how we can help maintain your dog's exercise routine while keeping them cool and comfortable this summer.`,
    type: 'blog',
    createdAt: '2023-06-15T10:20:00Z',
    updatedAt: '2023-06-15T14:35:00Z',
    status: 'published',
    author: 'AI Assistant',
    tags: ['summer', 'dog walking', 'pet safety', 'heat', 'dog care'],
    summary: 'A comprehensive guide to keeping dogs safe and comfortable during summer walks.',
    mediaAssets: [],
    thumbnailUrl: '',
    aspectRatio: '1:1',
    duration: 0,
    socialPlatforms: []
  },
  {
    id: '2',
    title: 'New Walker Onboarding Announcement',
    content: `# Welcome Our New Dog Walkers!\n\nDear WanderPaws Community,\n\nWe're excited to announce that we've expanded our team of professional dog walkers to better serve you and your furry friends!\n\n## Meet Our New Team Members\n\n### Sarah Johnson\nSarah joins us with over 5 years of experience in animal care, including 3 years at a local animal shelter. She specializes in working with shy and anxious dogs and has completed advanced training in canine body language.\n\n### Michael Torres\nMichael is a certified dog trainer who has worked with dogs of all sizes and temperaments. He's particularly skilled at managing high-energy breeds and providing the perfect balance of exercise and mental stimulation.\n\n### Emma Wilson\nEmma comes to us with a background in veterinary assistance and a passion for senior dog care. She understands the unique needs of older dogs and excels at providing gentle, attentive walks for dogs with mobility challenges.\n\n## Expanded Service Areas\n\nWith our growing team, we're thrilled to announce that we now offer services in the following additional neighborhoods:\n\n- Westside Heights\n- Northpark District\n- Lakeside Community\n- Eastwood Estates\n\n## Special Onboarding Offer\n\nTo celebrate our new team members, we're offering a special promotion for the month of July:\n\n**Book 5 walks with any of our new walkers and receive your 6th walk FREE!**\n\nSimply mention code NEW_WALKER when booking through our app or website.\n\n## Our Commitment to Quality\n\nAs always, all our dog walkers undergo rigorous background checks, training in pet first aid, and an extensive onboarding process to ensure they meet WanderPaws' high standards of care and professionalism.\n\nWe look forward to continuing to provide exceptional service to you and your canine companions!\n\nWoof regards,\n\nThe WanderPaws Team`,
    type: 'announcement',
    createdAt: '2023-06-10T09:15:00Z',
    updatedAt: '2023-06-10T09:15:00Z',
    status: 'draft',
    author: 'AI Assistant',
    tags: ['announcement', 'new walkers', 'staff', 'promotion'],
    summary: 'Information about the latest additions to our dog walker team.',
    mediaAssets: [],
    thumbnailUrl: '',
    aspectRatio: '1:1',
    duration: 0,
    socialPlatforms: []
  },
  {
    id: '3',
    title: 'Special Discount for Loyal Customers',
    content: `# Exclusive Summer Savings for Our Loyal Customers\n\nDear Valued WanderPaws Customer,\n\nAs the summer season approaches, we want to express our gratitude for your continued trust in our dog walking services. Your loyalty has been the foundation of our success, and we're excited to offer you an exclusive summer discount as a token of our appreciation.\n\n## Your Loyalty Reward\n\nAs a customer who has been with us for over a year, you're eligible for our **Summer Loyalty Discount**:\n\n**20% OFF all dog walking packages purchased before June 30th**\n\nThis special pricing applies to:\n- Daily walk packages\n- Weekly walk bundles\n- Premium adventure walks\n- Group play sessions\n\n## How to Redeem\n\nTo take advantage of this exclusive offer:\n\n1. Log in to your WanderPaws account\n2. Select your preferred walking package\n3. Enter code **LOYALSUMMER** at checkout\n4. Enjoy your savings!\n\n## Summer Schedule Filling Fast\n\nWith the busy summer season approaching, our schedule is filling quickly. We recommend securing your preferred walking times early to ensure your furry friend maintains their regular exercise routine throughout the summer months.\n\n## Thank You\n\nThank you again for choosing WanderPaws for your dog walking needs. We're honored to be part of your dog's life and look forward to many more happy walks together.\n\nWarm regards,\n\nThe WanderPaws Team\n\n---\n\n*This offer is valid until June 30th, 2023, and applies to services scheduled through September 30th, 2023. Cannot be combined with other promotions. Available only to customers with accounts older than 12 months.*`,
    type: 'email',
    createdAt: '2023-06-08T16:30:00Z',
    updatedAt: '2023-06-08T16:30:00Z',
    status: 'scheduled',
    scheduledFor: '2023-06-20T08:00:00Z',
    author: 'AI Assistant',
    tags: ['promotion', 'discount', 'customer loyalty', 'summer'],
    summary: 'Offering special discounts to customers who have been with us for over a year.',
    mediaAssets: [],
    thumbnailUrl: '',
    aspectRatio: '1:1',
    duration: 0,
    socialPlatforms: []
  }
];

/**
 * Get all content items
 */
export const getAllContentItems = (): Promise<ContentItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...contentItems]);
    }, 500);
  });
};

/**
 * Get a content item by ID
 */
export const getContentItemById = (id: string): Promise<ContentItem | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const contentItem = contentItems.find(item => item.id === id);
      resolve(contentItem || null);
    }, 500);
  });
};

/**
 * Create a new content item
 */
export const createContentItem = (contentItem: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentItem> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newItem: ContentItem = {
        ...contentItem,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      contentItems.push(newItem);
      resolve(newItem);
    }, 500);
  });
};

/**
 * Update a content item
 */
export const updateContentItem = (id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = contentItems.findIndex(item => item.id === id);
      
      if (index === -1) {
        resolve(null);
        return;
      }
      
      const updatedItem: ContentItem = {
        ...contentItems[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      contentItems[index] = updatedItem;
      resolve(updatedItem);
    }, 500);
  });
};

/**
 * Delete a content item
 */
export const deleteContentItem = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const initialLength = contentItems.length;
      contentItems = contentItems.filter(item => item.id !== id);
      
      resolve(contentItems.length < initialLength);
    }, 500);
  });
};

/**
 * Generate content with AI
 */
export const generateContentWithAI = (options: ContentGenerationOptions): Promise<PromptResponseItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock AI-generated responses based on options
      const responses: PromptResponseItem[] = [
        {
          content: `# Top 10 Dog Walking Tips for Summer\n\nAs temperatures rise, it's crucial to keep your furry friend safe and comfortable during walks. At WanderPaws, we understand the importance of maintaining your dog's exercise routine while protecting them from summer hazards.\n\n## 1. Time Your Walks Wisely\n\nEarly morning or evening walks are ideal during summer months. The pavement is cooler, and the temperature is more comfortable for your dog. Avoid walking between 10 AM and 4 PM when the sun is at its strongest.\n\n## 2. Check the Pavement Temperature\n\nBefore heading out, place your hand on the pavement for 7 seconds. If it's too hot for your hand, it's too hot for your dog's paws. Consider using protective booties or stick to grassy areas.\n\n## 3. Bring Plenty of Water\n\nAlways carry fresh water and a portable bowl. Offer water breaks every 15-20 minutes, especially on hot days.\n\n## 4. Know the Signs of Heatstroke\n\nBe alert for symptoms like excessive panting, drooling, bright red gums, vomiting, or collapse. Heatstroke requires immediate veterinary attention.\n\n## 5. Apply Dog-Safe Sunscreen\n\nDogs with short hair, pink skin, or white fur are susceptible to sunburn. Apply pet-safe sunscreen to exposed areas like the nose, ears, and belly.\n\n## 6. Keep Walks Shorter\n\nHot weather calls for shorter, more frequent walks rather than one long excursion. Monitor your dog's energy level and head home if they seem uncomfortable.\n\n## 7. Stay Hydrated Together\n\nBoth you and your dog need proper hydration. Drink water before, during, and after walks.\n\n## 8. Choose Shaded Routes\n\nPlan walks that offer plenty of shade from trees or buildings. Avoid open areas with no escape from the sun.\n\n## 9. Consider Cooling Accessories\n\nCooling vests, bandanas, and mats can help regulate your dog's temperature during and after walks.\n\n## 10. Listen to Your Dog\n\nYour dog will let you know when they've had enough. Pay attention to signals like slowing down, panting heavily, or seeking shade.\n\nAt WanderPaws, our professional dog walkers are trained to keep your pets safe in all weather conditions. Contact us today to learn how we can help maintain your dog's exercise routine while keeping them cool and comfortable this summer.`,
          score: 0.92
        },
        {
          content: `# Summer Dog Walking: Keeping Your Canine Cool and Safe\n\nSummer brings sunshine, outdoor adventures, and plenty of opportunities for walks with your four-legged friend. However, rising temperatures can pose risks to your dog's health and comfort. Here's how to ensure your summer dog walking routine remains safe and enjoyable.\n\n## Understanding Heat Risks for Dogs\n\nDogs don't regulate heat as efficiently as humans do. They primarily cool themselves by panting and through limited sweat glands in their paw pads. This makes them particularly vulnerable to heat-related issues, including dehydration, burned paw pads, and heatstroke.\n\n## Essential Summer Walking Guidelines\n\n### Timing is Everything\n\nSchedule walks during the cooler parts of the day—early morning or evening after sunset. The temperature difference can be significant and much more comfortable for your dog.\n\n### The Pavement Test\n\nBefore walking on any surface, test it with the back of your hand for 5-7 seconds. If it's uncomfortable for you, it will burn your dog's paws. Opt for grassy areas or invest in protective booties.\n\n### Hydration Strategy\n\nCarry water for both you and your dog. Collapsible bowls make it easy to offer frequent water breaks. Some dogs enjoy ice cubes as refreshing treats during walks.\n\n### Length and Intensity\n\nShorten your usual walking route during hot days. Consider multiple brief walks instead of one long one, allowing your dog to rest and cool down between outings.\n\n### Cooling Equipment\n\nConsider investing in cooling products like specialized vests or bandanas that use evaporation to keep your dog comfortable during walks.\n\n## Signs Your Dog Is Overheating\n\nWatch for these warning signals during summer walks:\n- Excessive panting or drooling\n- Bright red tongue or gums\n- Thick, sticky saliva\n- Weakness or collapse\n- Vomiting or diarrhea\n\nIf you notice these symptoms, move to shade immediately, offer water, and contact your vet for guidance.\n\n## Professional Walking Services\n\nAt WanderPaws, our trained dog walkers understand summer safety protocols and adjust walking schedules based on weather conditions. We ensure your dog gets the exercise they need without compromising their well-being.\n\nEnjoy the summer months with your canine companion by being mindful of the heat and making appropriate adjustments to your walking routine. Your dog will thank you with wagging tails and happy walks!`,
          score: 0.87
        },
        {
          content: `# Beat the Heat: Summer Dog Walking Safety Guide\n\nAs temperatures rise, keeping your furry friend safe during walks becomes even more important. At WanderPaws, we prioritize your dog's well-being in every season. Follow these essential tips to ensure your summer dog walks remain safe and enjoyable.\n\n## Morning and Evening Walks\n\nThe sun's intensity peaks between 10 AM and 4 PM. Schedule your walks during the cooler early morning or evening hours to protect your dog from excessive heat exposure.\n\n## Pavement Protection\n\nHot surfaces can burn your dog's sensitive paw pads within minutes. Before heading out, place your palm on the pavement for 5 seconds - if it's too hot for your hand, it's too hot for your dog's paws.\n\n## Hydration Matters\n\nBring fresh water and a portable bowl on every walk. Offer water breaks every 15 minutes, even if your dog doesn't seem thirsty. Proper hydration prevents heat exhaustion and keeps energy levels balanced.\n\n## Recognize Overheating Signs\n\nDogs can't tell us when they're too hot, but their bodies show clear signals:\n- Excessive panting or difficulty breathing\n- Drooling more than usual\n- Bright red or purple gums\n- Lethargy or disorientation\n- Vomiting or diarrhea\n\nIf you notice these symptoms, move to shade immediately, offer water, and contact your veterinarian.\n\n## Adjust Walk Duration\n\nHot weather isn't the time for marathon walks. Shorter, more frequent outings are better than one extended walk. Pay attention to your dog's energy levels and be willing to cut walks short if needed.\n\n## Seek Shady Routes\n\nPlan walking routes that offer plenty of shade from trees or buildings. Parks with good tree coverage provide natural cooling and protection from direct sunlight.\n\n## Consider Cooling Gear\n\nCooling vests, bandanas, and portable fans can help your dog stay comfortable during summer walks. These accessories use evaporative cooling to lower body temperature naturally.\n\n## Know Your Dog's Limits\n\nCertain dogs are more susceptible to heat-related issues:\n- Brachycephalic (flat-faced) breeds like Bulldogs and Pugs\n- Elderly or very young dogs\n- Overweight dogs\n- Dogs with thick coats\n- Dogs with pre-existing health conditions\n\nAdjust your walking routine based on your dog's specific needs and limitations.\n\n## Trust Professional Dog Walkers\n\nWanderPaws professional dog walkers are trained in heat safety protocols. We adjust walking schedules, routes, and durations based on weather conditions to keep your dog safe while ensuring they get the exercise they need.\n\nYour dog relies on you to make smart decisions about their well-being. By following these summer walking guidelines, you'll ensure those tail-wagging walks remain a highlight of your dog's day, even when temperatures rise.`,
          score: 0.95
        }
      ];
      
      resolve(responses);
    }, 2000);
  });
}; 