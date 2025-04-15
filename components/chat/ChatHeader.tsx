import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Briefcase, Building, HelpCircle, Menu, User } from "lucide-react"
import { ChatHeaderProps } from "./types"

export function ChatHeader({ 
  profileData, 
  isMobileView, 
  toggleMobileMenu, 
  startTour 
}: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
      <div className="p-4 max-w-3xl mx-auto flex items-center">
        {/* Mobile hamburger menu button - directly toggles menu in parent component */}
        <div className="md:hidden mr-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMobileMenu}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </div>

        <div className="flex-1">
          <h2 className="font-medium text-lg text-slate-800">
            CrayonD AI
          </h2>
        </div>
        
        {/* Help button to start tour */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-slate-500 hover:text-blue-600" 
          onClick={startTour}
        >
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Start tour</span>
        </Button>
      </div>
       
      {profileData && !isMobileView && (
        <motion.div 
          className="mt-0 mb-2 px-4 max-w-3xl mx-auto flex flex-wrap gap-2"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {profileData.targetRole && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Briefcase className="h-3 w-3 mr-1" />
              {profileData.targetRole}
            </Badge>
          )}
          {profileData.experience && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <User className="h-3 w-3 mr-1" />
              {profileData.experience} years exp.
            </Badge>
          )}
          {profileData.targetCompany && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <Building className="h-3 w-3 mr-1" />
              Target: {profileData.targetCompany}
            </Badge>
          )}
        </motion.div>
      )}
    </div>
  )
}
