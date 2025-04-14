"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToastAction } from "@/components/ui/toast"
import { toast } from "@/components/ui/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  targetRole: z.string().min(1, { message: "Please enter your target role." }),
  experience: z.string().min(1, { message: "Please select your experience level." }),
  skills: z.string().min(1, { message: "Please enter at least one skill." }),
})

type FormValues = z.infer<typeof formSchema>

interface UserProfileFormProps {
  onComplete: () => void
}

export function UserProfileForm({ onComplete }: UserProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      targetRole: "",
      experience: "",
      skills: "",
    },
  })

  const onSubmit = async (formData: FormValues) => {
    setIsSubmitting(true)
    try {
      // Process the skills string into an array
      const skillsArray = formData.skills.split(',').map(skill => skill.trim())
      
      // Store the profile data in localStorage for persistence
      localStorage.setItem('userProfile', JSON.stringify({
        ...formData,
        skills: skillsArray
      }))
      
      // Show success message
      toast({
        title: "Profile created successfully!",
        description: "Your personalized interview coaching is ready.",
        className: "bg-green-50 border-green-200",
      })

      // Redirect to the chat dashboard after a small delay
      setTimeout(() => {
        onComplete()
      }, 1000)
    } catch (error) {
      console.error("Error saving profile:", error)

      // Show error to user
      toast({
        title: "Error saving profile",
        description: "There was an error creating your profile. Please try again.",
        variant: "destructive",
        action: (
          <ToastAction altText="Try again" onClick={() => form.handleSubmit(onSubmit)()}>
            Try again
          </ToastAction>
        ),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-indigo-800 font-medium">Your Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    {...field} 
                    className="bg-white border-indigo-200 focus-visible:ring-indigo-500" 
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <FormField
            control={form.control}
            name="targetRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-indigo-800 font-medium">Target Role</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Software Engineer" 
                    {...field} 
                    className="bg-white border-indigo-200 focus-visible:ring-indigo-500" 
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-indigo-800 font-medium">Years of Experience</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white border-indigo-200 focus:ring-indigo-500">
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0-1">Less than 1 year</SelectItem>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-indigo-800 font-medium">Key Skills</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="React, Node.js, TypeScript" 
                    {...field} 
                    className="bg-white border-indigo-200 focus-visible:ring-indigo-500" 
                  />
                </FormControl>
                <FormDescription className="text-indigo-600/70">
                  Enter your key skills, separated by commas.
                </FormDescription>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="pt-4"
        >
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Your Profile...
              </>
            ) : (
              "Create Profile & Continue"
            )}
          </Button>
        </motion.div>
      </form>
    </Form>
  )
}
