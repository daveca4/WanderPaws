import { DashboardSummary } from '@/components/DashboardSummary';
import { UpcomingWalks } from '@/components/UpcomingWalks';
import { DogList } from '@/components/DogList';
import { RecentActivities } from '@/components/RecentActivities';
import { AIRecommendations } from '@/components/AIRecommendations';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-primary-500 text-white relative overflow-hidden">
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-white">Wander</span>Paws
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white max-w-lg">
                Professional dog walking service that keeps tails wagging and owners smiling.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/login" 
                  className="bg-white text-primary-600 px-6 py-3 rounded-md font-medium text-lg hover:bg-gray-100 transition-all"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="bg-primary-700 text-white px-6 py-3 rounded-md font-medium text-lg hover:bg-primary-800 transition-all border border-white"
                >
                  Register Now
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md">
                <Image 
                  src="/images/hero-dog.png" 
                  alt="Happy dog on a walk" 
                  width={400} 
                  height={400}
                  className="rounded-md shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose WanderPaws?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">We combine technology and a love for pets to provide the best walking experience for your dogs.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-md shadow-sm hover:shadow transition-shadow border border-gray-200">
            <div className="w-12 h-12 rounded-md bg-primary-100 flex items-center justify-center text-2xl mb-6 text-primary-500">
              🚶‍♀️
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Scheduled Walks</h3>
            <p className="text-gray-600">
              Reliable daily walks designed around your dog's needs. Choose between morning or afternoon time slots.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-md shadow-sm hover:shadow transition-shadow border border-gray-200">
            <div className="w-12 h-12 rounded-md bg-primary-100 flex items-center justify-center text-2xl mb-6 text-primary-500">
              👥
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Socialization</h3>
            <p className="text-gray-600">
              Group adventures with carefully selected playmates, enhancing your dog's social skills and happiness.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-md shadow-sm hover:shadow transition-shadow border border-gray-200">
            <div className="w-12 h-12 rounded-md bg-primary-100 flex items-center justify-center text-2xl mb-6 text-primary-500">
              📱
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Updates</h3>
            <p className="text-gray-600">
              Receive pictures, route maps and live updates during your dog's walks through our intuitive app.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Your journey with WanderPaws is simple and straightforward.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-md shadow-sm text-center">
              <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-4">1</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Register</h3>
              <p className="text-gray-600">Create your account and add your dogs to our system.</p>
            </div>
            
            <div className="bg-white p-6 rounded-md shadow-sm text-center">
              <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-4">2</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Assessment</h3>
              <p className="text-gray-600">We'll assess your dog to ensure the best match with our walkers.</p>
            </div>
            
            <div className="bg-white p-6 rounded-md shadow-sm text-center">
              <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-4">3</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscribe</h3>
              <p className="text-gray-600">Choose a subscription plan that suits your walking needs.</p>
            </div>
            
            <div className="bg-white p-6 rounded-md shadow-sm text-center">
              <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-4">4</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Book Walks</h3>
              <p className="text-gray-600">Schedule walks and enjoy peace of mind while we care for your dog.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Don't just take our word for it – hear what dog owners have to say.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="text-primary-500 text-3xl">❝</div>
            </div>
            <p className="text-gray-700 mb-6">WanderPaws has been a lifesaver for my busy schedule. My dog Baxter is always thrilled when their walker arrives, and I love getting the photos during their adventures!</p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full mr-4"></div>
              <div>
                <h4 className="font-semibold text-gray-900">Emma T.</h4>
                <div className="text-primary-500 text-sm">Boston Terrier Owner</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="text-primary-500 text-3xl">❝</div>
            </div>
            <p className="text-gray-700 mb-6">The assessment process was thorough and made me confident that WanderPaws really understands my dog's needs. Their walkers are professional and caring.</p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full mr-4"></div>
              <div>
                <h4 className="font-semibold text-gray-900">Michael R.</h4>
                <div className="text-primary-500 text-sm">Golden Retriever Owner</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-md shadow-sm border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="text-primary-500 text-3xl">❝</div>
            </div>
            <p className="text-gray-700 mb-6">My anxious rescue dog has blossomed since starting with WanderPaws. Their walker took the time to build trust, and now my dog can't wait for walk days!</p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full mr-4"></div>
              <div>
                <h4 className="font-semibold text-gray-900">Sarah J.</h4>
                <div className="text-primary-500 text-sm">Mixed Breed Owner</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-500 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to give your dog the walks they deserve?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">Join hundreds of happy dogs and their owners already using WanderPaws.</p>
          <Link 
            href="/register" 
            className="bg-white text-primary-600 px-8 py-4 rounded-md font-medium text-lg hover:bg-gray-100 transition-all inline-block"
          >
            Get Started Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-2xl font-bold">
                <span className="text-primary-500">Wander</span>Paws
              </div>
              <p className="text-gray-400 mt-2">The premier dog walking service</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
              <Link href="/login?returnUrl=/admin" className="text-gray-300 hover:text-white">Admin</Link>
              <Link href="/login?returnUrl=/owner-dashboard" className="text-gray-300 hover:text-white">Owners</Link>
              <Link href="/login?returnUrl=/walker-dashboard" className="text-gray-300 hover:text-white">Walkers</Link>
              <Link href="/register" className="text-gray-300 hover:text-white">Register</Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} WanderPaws. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 