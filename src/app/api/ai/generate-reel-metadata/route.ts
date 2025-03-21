import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaTypes, theme, audience, tone } = body;
    
    // This would call an actual AI service in production
    // For now, we'll use pre-defined templates and randomize

    // Generate 3 title options
    const titlePrefixes = [
      'Discover', 'Explore', 'Experience', 'Unleash', 'Transform', 
      'Elevate', 'Embrace', 'Journey Through', 'Behind the Scenes',
      'The Ultimate Guide to', 'Essential Tips for', 'How to'
    ];
    
    const titleThemes = {
      'dogs': ['Dog Walking', 'Canine Care', 'Pet Parenting', 'Dog Training', 'Puppy Love'],
      'walking': ['Daily Walks', 'Exercise Routines', 'Outdoor Adventures', 'Trail Explorations'],
      'training': ['Obedience Training', 'Behavior Basics', 'Command Mastery', 'Skill Building'],
      'care': ['Pet Care', 'Grooming Guide', 'Health & Wellness', 'Nutrition Essentials']
    };
    
    const titleSuffixes = [
      'for Every Dog Owner', 'You Need to See', 'That Will Amaze You',
      'in Just 30 Seconds', 'Made Simple', 'Like Never Before',
      'with WanderPaws', 'for Happy, Healthy Dogs'
    ];
    
    // Generate descriptions based on tone
    const descriptionsByTone = {
      'professional': [
        'Expert advice on professional dog care techniques that ensure your pet stays healthy and happy.',
        'Professionally crafted guide showcasing best practices for responsible pet ownership.',
        'Comprehensive overview of industry-standard approaches to canine wellness and training.'
      ],
      'casual': [
        'Check out these awesome tips that will make life with your furry friend so much easier!',
        'Just a few simple hacks that have totally changed the game for dog parents everywhere.',
        'Fun and easy ways to bond with your pup while keeping them healthy and happy.'
      ],
      'humorous': [
        "Who said dog training can't be hilarious? Watch as these pups turn everyday moments into comedy gold!",
        "When dogs take charge: a funny look at who's really running the household (spoiler: it's not you).",
        "The secret life of dogs: what they're REALLY thinking during walkies and treat time."
      ],
      'inspirational': [
        'Witness the incredible bond between humans and their canine companions in this heartwarming journey.',
        'Discover how the simple joy of dog ownership can transform your life in unexpected ways.',
        'The powerful story of how dogs bring purpose, compassion and love into our everyday lives.'
      ]
    };
    
    // Select theme terms based on input
    const selectedTheme = theme || 'dogs';
    const selectedTone = tone || 'professional';
    const themeTerms = titleThemes[selectedTheme as keyof typeof titleThemes] || titleThemes.dogs;
    
    // Generate 3 title options
    const generateTitle = () => {
      const prefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
      const themeTerm = themeTerms[Math.floor(Math.random() * themeTerms.length)];
      const suffix = titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
      
      // 50% chance to include suffix
      return Math.random() > 0.5 ? `${prefix} ${themeTerm}` : `${prefix} ${themeTerm} ${suffix}`;
    };
    
    const titles = [
      generateTitle(),
      generateTitle(),
      generateTitle(),
    ];
    
    // Get descriptions based on tone
    const descriptions = descriptionsByTone[selectedTone as keyof typeof descriptionsByTone] || 
                         descriptionsByTone.professional;
    
    // Create suggested tags
    const suggestedTags = [
      selectedTheme,
      selectedTone,
      'video',
      'social media',
      'reel',
      'wanderpaws',
      mediaTypes?.includes('image') ? 'images' : '',
      mediaTypes?.includes('video') ? 'videos' : '',
    ].filter(Boolean);
    
    return NextResponse.json({
      titles,
      descriptions,
      suggestedTags
    });
  } catch (error) {
    console.error('Error generating reel metadata:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 