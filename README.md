# WanderPaws - AI-Powered Dog Walking Management System

WanderPaws is a comprehensive dog walking management system that leverages AI to optimize scheduling, match dogs with compatible walkers, and provide health insights based on walk data.

## Features

- **Smart Dog-Walker Matching**: AI analyzes dog temperament, walker specialties, and past experiences to recommend the most suitable walkers
- **Intelligent Scheduling**: Generates optimized walk schedules based on dog needs, walker availability, and owner preferences
- **Health & Behavior Insights**: Tracks and analyzes walk metrics to provide actionable insights about your dog's health and behavior
- **Detailed Walk Tracking**: Logs comprehensive walk data including distance, duration, bathroom breaks, mood, and observed behaviors
- **User-Friendly Interface**: Modern, intuitive dashboard for dog owners and walkers

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **AI/ML**: Integrated with OpenAI for intelligent recommendations and insights
- **Data Visualization**: Interactive charts and maps for visualizing walk data

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `/src/app` - Next.js application routes and pages
- `/src/components` - Reusable UI components
- `/src/lib` - Core application logic, types, and data models
- `/src/utils` - Helper functions and utilities

## AI Capabilities

WanderPaws uses AI to:

1. **Match dogs with compatible walkers** by analyzing factors such as:
   - Dog temperament and special needs
   - Walker specialties and experience
   - Past walk ratings and feedback
   - Walker availability and preferred dog sizes

2. **Generate optimized walking schedules** considering:
   - Dog exercise requirements based on breed, age, and size
   - Owner preferences and constraints
   - Historical walking patterns
   - Weather conditions (in future versions)

3. **Provide health and behavior insights** by analyzing:
   - Walk metrics (distance, duration, pace)
   - Bathroom habits
   - Mood ratings
   - Observed behaviors
   - Trends over time

---

WanderPaws - Making dog walking more intelligent, efficient, and insightful.