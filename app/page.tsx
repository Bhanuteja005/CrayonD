"use client";

import Link from "next/link";
import { useState } from "react";

// Navbar Component
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="fixed w-full bg-white shadow-sm py-4 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl text-blue-600">📝</span>
          <span className="font-bold text-xl text-blue-600">CrayonD AI</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="#how-it-works" className="text-gray-700 hover:text-blue-600">How It Works</Link>
          <Link href="#features" className="text-gray-700 hover:text-blue-600">Features</Link>
          <Link href="/onboarding">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
              Get Started
            </button>
          </Link>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-gray-700"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-4">
            <Link href="#how-it-works" className="text-gray-700 hover:text-blue-600 py-2">How It Works</Link>
            <Link href="#features" className="text-gray-700 hover:text-blue-600 py-2">Features</Link>
            <Link href="/onboarding">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

// Use Case Card Component
function UseCaseCard({ emoji, title, description, example }: { emoji: string; title: string; description: string; example: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{emoji}</span>
        <h3 className="text-xl font-semibold">{title}</h3>
      </div>
      <p className="text-gray-700 mb-3">{description}</p>
      <div className="bg-gray-50 rounded p-3 border border-gray-200">
        <p className="italic text-gray-600 text-sm">"{example}"</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="relative bg-gradient-to-b from-blue-50 to-white pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-blue-100 text-blue-700 rounded-full px-4 py-1 inline-block text-sm font-medium mb-6">
            AI-Powered Interview Coach
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Ace Your Interviews with 
            <span className="text-blue-600 block mt-2">
              Intelligent AI Coaching
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            CrayonD AI remembers your background, skills, and interview history 
            to provide personalized coaching that evolves with you.
            Get real-time insights for any company or role.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Link href="/onboarding">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
                Start Free 
              </button>
            </Link>
            <Link href="#how-it-works">
              <button className="bg-white border border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600 px-8 py-3 rounded-lg font-medium">
                Learn More
              </button>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-1 mr-2">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-gray-700">Remembers past sessions</span>
            </div>
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-1 mr-2">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-gray-700">Company-specific guidance</span>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* How It Works Section */}
      <section className="py-16" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              HOW IT WORKS
            </div>
            <h2 className="text-3xl font-bold mb-4">How CrayonD AI Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our intelligent system remembers everything about your job search and provides real-time insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon="📋"
              title="Long-Term Memory"
              description="Our system stores your career details, target roles, and practice history - even after you clear your chat history."
            />
            
            <FeatureCard 
              icon="⚡"
              title="Real-Time Knowledge"
              description="Connect to the latest job market data, company news, and industry trends for your interview preparation."
            />
            
            <FeatureCard 
              icon="💡"
              title="Personalized Coaching"
              description="Receive tailored interview questions and feedback based on your specific background, skills, and target companies."
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              FEATURES
            </div>
            <h2 className="text-3xl font-bold mb-4">How You Can Use CrayonD AI</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our intelligent interview coach adapts to various industries and interview scenarios.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UseCaseCard 
              emoji="💼"
              title="Technical Interview Preparation"
              description="Practice coding challenges, system design questions, and technical concepts specific to your target role and company."
              example="What are the most common data structure questions asked in Amazon SDE interviews right now?"
            />
            
            <UseCaseCard 
              emoji="🤝"
              title="Behavioral Question Mastery"
              description="Get coached on STAR method responses that highlight your unique experiences and align with company values."
              example="How should I structure my leadership story for my upcoming Facebook PM interview?"
            />
            
            <UseCaseCard 
              emoji="🔍"
              title="Company Research Assistant"
              description="Access real-time information about company culture, recent developments, and strategic initiatives to inform your answers."
              example="What recent news about Microsoft should I be aware of for my interview tomorrow?"
            />
            
            <UseCaseCard 
              emoji="📊"
              title="Performance Analysis"
              description="Receive detailed feedback on your practice responses with specific areas for improvement tracked across sessions."
              example="Based on my previous practice sessions, what aspects of my communication should I improve?"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your interview skills?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Our AI coach remembers everything about your job search journey and provides personalized guidance that evolves with you.
          </p>
          <Link href="/onboarding">
            <button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-medium rounded-lg">
              Get Started Free
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-8 text-center">
        <div className="container mx-auto px-4">
          <div className="text-white font-bold text-xl mb-4">CrayonD AI</div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} CrayonD AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}