"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useEffect, useState } from "react"

// Navbar component
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  return (
    <nav className="fixed w-full bg-white/90 backdrop-blur-sm z-50 py-4 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="text-2xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
              <path d="M20 20v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path>
              <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"></path>
              <path d="M12 4v6"></path>
              <path d="M2 20h20"></path>
            </svg>
          </motion.div>
          <span className="font-bold text-xl text-indigo-600">CrayonD AI</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
        <Link href="#ab" className="text-slate-700 hover:text-indigo-600 font-medium">How It Works</Link>

          <Link href="#how" className="text-slate-700 hover:text-indigo-600 font-medium">Features</Link>
          <Link href="/onboarding">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-md transition-all">
              Get Started
            </button>
          </Link>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-slate-700"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-white border-t"
        >
          <div className="container mx-auto px-4 py-3 flex flex-col space-y-4">
          <Link href="#ab" className="text-slate-700 hover:text-indigo-600 font-medium py-2">How It Works</Link>
            <Link href="#how" className="text-slate-700 hover:text-indigo-600 font-medium py-2">Features</Link>
            <div className="flex flex-col space-y-2 pt-2">
              <Link href="/onboarding">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  )
}

// Animated typing component
const TypedText = ({ texts }: { texts: string[] }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isTyping, setIsTyping] = useState(true)
  
  useEffect(() => {
    const currentFullText = texts[currentTextIndex]
    
    if (isTyping) {
      if (displayText.length < currentFullText.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentFullText.substring(0, displayText.length + 1))
        }, 200) // Slowed down typing speed from 100ms to 150ms
        return () => clearTimeout(timeout)
      } else {
        setIsTyping(false)
        const timeout = setTimeout(() => {
          setIsTyping(false)
        }, 4000) // Increased pause at the end from 2000ms to 3000ms to read the full text
        return () => clearTimeout(timeout)
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(displayText.substring(0, displayText.length - 1))
        }, 75) // Slowed down erasing speed from 50ms to 75ms
        return () => clearTimeout(timeout)
      } else {
        setIsTyping(true)
        setCurrentTextIndex((currentTextIndex + 1) % texts.length)
      }
    }
  }, [displayText, isTyping, currentTextIndex, texts])
  
  return (
    <span className="inline-block min-h-[40px]">
      {displayText}
      <span className={`ml-1 inline-block w-1 h-5 bg-indigo-600 ${isTyping ? 'animate-pulse' : ''}`}></span>
    </span>
  )
}

// Testimonial component
const Testimonial = ({ quote, author, role, delay = 0 }: { quote: string; author: string; role: string; delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    className="bg-white p-6 rounded-xl shadow-md border border-slate-100"
  >
    <div className="flex items-start mb-4">
      <svg className="w-8 h-8 text-indigo-400 mr-2 mt-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.51.88-3.995 2.764-3.995 5.02v2.829h3.983v8h-9.966zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.511.88-3.996 2.764-3.996 5.02v2.829h3.983v8h-9.983z" />
      </svg>
      <p className="text-slate-700 italic">{quote}</p>
    </div>
    <div className="flex items-center">
      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mr-3">
        {author.charAt(0)}
      </div>
      <div>
        <p className="font-medium text-slate-900">{author}</p>
        <p className="text-sm text-slate-500">{role}</p>
      </div>
    </div>
  </motion.div>
)

// Feature card component
const FeatureCard = ({ icon, title, description, delay = 0 }: { icon: React.ReactNode; title: string; description: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-100 hover:border-indigo-100"
  >
    <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-3 text-slate-800">{title}</h3>
    <p className="text-slate-600">{description}</p>
  </motion.div>
)

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pb-24 overflow-hidden relative">
        {/* Background elements */}
        <motion.div 
          className="absolute top-20 right-0 -z-10 opacity-10"
          animate={{ 
            x: [20, 0, 20],
            y: [0, 20, 0]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <div className="w-96 h-96 rounded-full bg-indigo-400 blur-3xl" />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-0 left-0 -z-10 opacity-10"
          animate={{ 
            x: [0, 20, 0],
            y: [20, 0, 20]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <div className="w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
        </motion.div>
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="md:w-1/2 mb-10 md:mb-0 md:pr-10"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
                  AI-Powered Interview Coach with Memory
                </div>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-6"
              >
                Master Your <span className="text-indigo-600 text-3xl md:text-5xl block mt-2">
                  <TypedText texts={["Interviews", "Responses", "Career Path", "Job Search"]} />
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-xl text-slate-600 mb-8"
              >
                Our AI coach remembers your background, skills, and goals across sessions to provide
                targeted interview preparation with real-time industry insights and company-specific guidance.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/onboarding">
                  <button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto flex items-center justify-center"
                  >
                    <span>Start Your Prep</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </Link>
                
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-8 flex items-center text-sm text-slate-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Remembers your details across sessions</span>
                <span className="mx-3">•</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Real-time company insights</span>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="md:w-1/2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative">
                <motion.div
                  className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center z-10 shadow-lg"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <span className="text-yellow-800 font-bold text-sm text-center">Powered by Vector DB</span>
                </motion.div>
                
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
                >
                  <div className="bg-white rounded-t-2xl border-b border-slate-200 px-4 py-2 flex items-center">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="mx-auto text-sm text-slate-500 font-medium">Interview Coach Chat</div>
                  </div>

                  <div className="bg-white p-6">
                    <div className="flex mb-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                      <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                        <p className="text-slate-700">I have an interview with Google next week for a Product Manager role. Can you help me prepare?</p>
                      </div>
                    </div>

                    <div className="flex mb-4 justify-end">
                      <div className="bg-indigo-100 rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
                        <p className="text-slate-700">Welcome back, Sarah! I remember you're targeting Product Manager roles in tech. Let's prepare for your Google interview. Would you like to focus on behavioral questions or product case studies?</p>
                      </div>
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 16a5 5 0 0010 0v-1a1.5 1.5 0 00-3 0v1a2 2 0 01-4 0 2.5 2.5 0 012.5-2.5h2.5a1 1 0 100-2H9a3 3 0 00-3 3v1.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex mb-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                      <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                        <p className="text-slate-700">Let's start with product case studies. What's the latest news about Google that might come up in the interview?</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-indigo-100 rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
                        <p className="text-slate-700">I'll check the latest news about Google for you! Based on my real-time data, Google recently announced new AI features for their search engine and workspace tools. This would be excellent to mention in your interview...</p>
                      </div>
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 005 16a5 5 0 0010 0v-1a1.5 1.5 0 00-3 0v1a2 2 0 01-4 0 2.5 2.5 0 012.5-2.5h2.5a1 1 0 100-2H9a3 3 0 00-3 3v1.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    <div className="mt-4 relative">
                      <input 
                        type="text" 
                        className="w-full bg-slate-100 rounded-full py-3 px-5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                        placeholder="Ask a question..."
                      />
                      <button className="absolute right-2 top-2 bg-indigo-600 text-white p-2 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  className="absolute -bottom-6 -left-6 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <span className="text-sm font-medium">Persistent memory across sessions</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24" id="ab">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
              AI-POWERED PROCESS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">How CrayonD AI Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Our intelligent system remembers everything about your job search and provides real-time insights.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>}
              title="Long-Term Memory"
              description="Our Vector DB stores your career details, target roles, and practice history - even after you clear your chat history."
              delay={0}
            />
            
            <FeatureCard 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>}
              title="Real-Time Knowledge"
              description="Connect to the latest job market data, company news, and industry trends through our integrated API tools."
              delay={0.1}
            />
            
            <FeatureCard 
              icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>}
              title="Personalized Coaching"
              description="Receive tailored interview questions and feedback based on your specific background, skills, and target companies."
              delay={0.2}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-16 bg-white rounded-2xl shadow-lg p-8 md:p-12"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Intelligent Memory System</h3>
                <p className="text-lg text-slate-600 mb-6">Our interview coach remembers everything important about your job search journey, even when you start new conversations.</p>
                
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Career Profile Storage</h4>
                      <p className="text-slate-600">Your background, skills, and target roles are securely stored in our Vector Database.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Interview Practice History</h4>
                      <p className="text-slate-600">We track which questions you've practiced and areas for improvement over time.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Company Research</h4>
                      <p className="text-slate-600">Details about your target companies and their values are remembered across sessions.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:w-1/2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-100 rounded-full opacity-50"></div>
                  <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-100 rounded-full opacity-50"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-slate-900">Vector Database Integration</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-800">User Profile Vector</span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Persistent</span>
                        </div>
                        <div className="text-sm text-slate-600 font-mono bg-slate-50 p-2 rounded">
                          {`{career_history: "5 years in marketing", skills: ["data analysis", "project management"], target_role: "Marketing Director"}`}
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-800">Company Research Vector</span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Real-time</span>
                        </div>
                        <div className="text-sm text-slate-600 font-mono bg-slate-50 p-2 rounded">
                          {`{company: "TechCorp", values: ["innovation", "collaboration"], recent_news: "New product launch in Q2"}`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Use Cases Section */}
      <section className="py-16 md:py-24" id="how">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
              PREPARATION MADE EASY
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">How You Can Use CrayonD AI</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Our intelligent interview coach adapts to various industries and interview scenarios.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-xl border border-indigo-100"
            >
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-4">💼</span>
                <h3 className="text-xl font-semibold text-slate-900">Technical Interview Preparation</h3>
              </div>
              <p className="text-slate-700 mb-4">Practice coding challenges, system design questions, and technical concepts specific to your target role and company.</p>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                <p className="italic text-slate-600 text-sm">"What are the most common data structure questions asked in Amazon SDE interviews right now?"</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100"
            >
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-4">🤝</span>
                <h3 className="text-xl font-semibold text-slate-900">Behavioral Question Mastery</h3>
              </div>
              <p className="text-slate-700 mb-4">Get coached on STAR method responses that highlight your unique experiences and align with company values.</p>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                <p className="italic text-slate-600 text-sm">"How should I structure my leadership story for my upcoming Facebook PM interview?"</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-xl border border-purple-100"
            >
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-4">🔍</span>
                <h3 className="text-xl font-semibold text-slate-900">Company Research Assistant</h3>
              </div>
              <p className="text-slate-700 mb-4">Access real-time information about company culture, recent developments, and strategic initiatives to inform your answers.</p>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                <p className="italic text-slate-600 text-sm">"What recent news about Microsoft should I be aware of for my interview tomorrow?"</p>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-xl border border-indigo-100"
            >
              <div className="flex items-center mb-6">
                <span className="text-2xl mr-4">📊</span>
                <h3 className="text-xl font-semibold text-slate-900">Performance Analysis</h3>
              </div>
              <p className="text-slate-700 mb-4">Receive detailed feedback on your practice responses with specific areas for improvement tracked across sessions.</p>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                <p className="italic text-slate-600 text-sm">"Based on my previous practice sessions, what aspects of my communication should I improve?"</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-700 py-16 md:py-20 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-indigo-200 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-white mb-6"
            >
              Ready to transform your interview skills?
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-indigo-100 text-xl max-w-2xl mx-auto mb-8"
            >
              Our AI coach remembers everything about your job search journey and provides personalized guidance that evolves with you.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link href="/onboarding">
                <button
                  className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 text-lg font-medium rounded-xl shadow-lg"
                >
                  Get Started Free
                </button>
              </Link>
              
            </motion.div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-slate-900 py-10 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="font-bold text-xl text-white">CrayonD AI</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} CrayonD AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}