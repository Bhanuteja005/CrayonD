"use client"

import { UserProfileForm } from "@/components/UserProfileForm"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const router = useRouter()

  const handleProfileComplete = () => {
    // Set a flag to indicate the user is coming from onboarding
    sessionStorage.setItem('fromOnboarding', 'true');

    // Clear any previous tour status to ensure the tour guide will show
    localStorage.removeItem('hasSeenTour');

    // Then continue with your existing redirect code
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* Header with back button */}
      <header className="container mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to home</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-indigo-100">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left side - Form */}
              <div className="p-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-indigo-900 mb-2">Create Your Profile</h1>
                  <p className="text-indigo-700">
                    Help us personalize your interview coaching experience with a few details about yourself
                  </p>
                </div>
                <UserProfileForm onComplete={handleProfileComplete} />
              </div>

              {/* Right side - Illustration and benefits */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 flex flex-col justify-between hidden md:flex">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Your Personal Interview Coach</h2>
                  <ul className="space-y-4">
                    {[
                      "Personalized interview preparation based on your experience",
                      "Industry-specific questions tailored to your target roles",
                      "Real-time feedback on your answers",
                      "Company research to help you stand out",
                    ].map((benefit, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        className="flex items-start"
                      >
                        <div className="bg-white/20 rounded-full p-1 mr-3 mt-0.5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        {benefit}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  <p className="text-white/80 text-sm">
                    "The interview coach helped me prepare for questions I never would have anticipated. I got the job!"
                  </p>
                  <p className="text-white/90 font-medium mt-2">— Sarah K., Software Engineer</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
