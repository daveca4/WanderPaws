'use client';

import { useState, useCallback } from 'react';

interface TitleGeneratorProps {
  onSelect: (title: string) => void;
  initialTitle?: string;
}

export default function TitleGenerator({ onSelect, initialTitle = '' }: TitleGeneratorProps) {
  const [baseTitle, setBaseTitle] = useState(initialTitle);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Title templates with placeholders
  const titleTemplates = [
    "How to {verb} Your {subject} Like a Pro",
    "The Ultimate Guide to {verb}ing {subject}",
    "{number} Ways to Improve Your {subject} Today",
    "{subject}: What Every Dog Owner Should Know",
    "Why Your {subject} Needs {improvement} Now",
    "Transform Your {subject} with These Simple Tricks",
    "The Secret to Perfect {subject} Every Time",
    "{verb}ing Your {subject}: Essential Tips",
    "From Beginner to Expert: Mastering {subject}",
    "{number} {subject} Hacks That Will Change Your Life"
  ];

  const verbs = [
    "Train", "Walk", "Groom", "Exercise", "Feed", 
    "Care for", "Understand", "Bond with", "Play with", "Socialize"
  ];

  const subjects = [
    "Dog", "Puppy", "Pet", "Canine Companion", "Furry Friend",
    "Dog Walking Routine", "Training Sessions", "Pet Care Ritual"
  ];

  const improvements = [
    "Extra Attention", "Professional Care", "Special Training",
    "New Techniques", "Advanced Methods", "Quality Time"
  ];

  const numbers = ["3", "5", "7", "10", "12", "15"];

  const generateVariations = useCallback(() => {
    setIsGenerating(true);
    
    // Generate 5 random title variations based on templates
    const newTitles = Array(5).fill(0).map(() => {
      // Select random template
      const template = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
      
      // Replace placeholders with random values
      return template
        .replace('{verb}', verbs[Math.floor(Math.random() * verbs.length)])
        .replace('{subject}', subjects[Math.floor(Math.random() * subjects.length)])
        .replace('{improvement}', improvements[Math.floor(Math.random() * improvements.length)])
        .replace('{number}', numbers[Math.floor(Math.random() * numbers.length)]);
    });
    
    setGeneratedTitles(newTitles);
    setTimeout(() => setIsGenerating(false), 500);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-end space-x-3">
        <div className="flex-grow">
          <label htmlFor="base-title" className="block text-xs font-medium text-gray-700 mb-1">
            Enter a base title or keyword
          </label>
          <input
            type="text"
            id="base-title"
            value={baseTitle}
            onChange={(e) => setBaseTitle(e.target.value)}
            className="focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            placeholder="e.g., dog walking, puppy training"
          />
        </div>
        <button
          type="button"
          onClick={generateVariations}
          disabled={isGenerating}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Variations'
          )}
        </button>
      </div>
      
      {generatedTitles.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-gray-700 mb-2">Title Variations</h5>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {generatedTitles.map((title, index) => (
              <div key={index} className="flex justify-between bg-white p-2 rounded border border-gray-100 hover:border-gray-300">
                <span className="text-sm">{title}</span>
                <button
                  type="button"
                  onClick={() => onSelect(title)}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 