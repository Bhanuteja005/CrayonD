import type { Tool } from "@ai-sdk/core"

export class InterviewToolkit {
  private tools: Tool[]

  constructor() {
    this.tools = [this.createQuestionGeneratorTool(), this.createJobMarketTool()]
  }

  getTools(): Tool[] {
    return this.tools
  }

  private createQuestionGeneratorTool(): Tool {
    return {
      name: "generate_interview_questions",
      description: "Generates relevant interview questions based on job role and skills",
      parameters: {
        type: "object",
        properties: {
          role: {
            type: "string",
            description: 'The job role (e.g., "Software Engineer", "Product Manager")',
          },
          skills: {
            type: "array",
            items: {
              type: "string",
            },
            description: "List of skills to focus on",
          },
          difficulty: {
            type: "string",
            enum: ["easy", "medium", "hard"],
            description: "Difficulty level of questions",
          },
          count: {
            type: "number",
            description: "Number of questions to generate",
          },
        },
        required: ["role"],
      },
      execute: async ({ role, skills = [], difficulty = "medium", count = 5 }) => {
        try {
          // In a real implementation, this might call an external API
          // For now, we'll generate questions based on the input

          const commonQuestions = [
            "Tell me about yourself and your experience.",
            "Why are you interested in this role?",
            "What are your greatest strengths and weaknesses?",
            "Describe a challenging situation you faced and how you handled it.",
            "Where do you see yourself in 5 years?",
          ]

          const technicalQuestions: Record<string, string[]> = {
            "Software Engineer": [
              "Explain the difference between a stack and a queue.",
              "What is the time complexity of binary search?",
              "Describe the MVC architecture pattern.",
              "How would you optimize a slow database query?",
              "Explain the concept of dependency injection.",
            ],
            "Data Scientist": [
              "Explain the difference between supervised and unsupervised learning.",
              "What is overfitting and how can you prevent it?",
              "Describe the process of feature selection.",
              "What is the curse of dimensionality?",
              "Explain the bias-variance tradeoff.",
            ],
            "Product Manager": [
              "How do you prioritize features in a product roadmap?",
              "Describe your process for gathering user requirements.",
              "How do you measure the success of a product?",
              "Describe a time when you had to make a difficult product decision.",
              "How do you handle stakeholder disagreements?",
            ],
          }

          const skillBasedQuestions = skills.flatMap((skill) => {
            switch (skill.toLowerCase()) {
              case "react":
                return [
                  "Explain the virtual DOM in React.",
                  "What are React hooks and why were they introduced?",
                  "Describe the component lifecycle in React.",
                ]
              case "node.js":
                return [
                  "How does the event loop work in Node.js?",
                  "What are streams in Node.js?",
                  "Explain the difference between process.nextTick() and setImmediate().",
                ]
              case "python":
                return ["What are decorators in Python?", "Explain list comprehensions.", "What is the GIL in Python?"]
              default:
                return [`Describe your experience with ${skill}.`]
            }
          })

          // Combine and select questions based on role and skills
          let relevantQuestions = [...commonQuestions]

          if (role in technicalQuestions) {
            relevantQuestions = [...relevantQuestions, ...technicalQuestions[role]]
          }

          if (skillBasedQuestions.length > 0) {
            relevantQuestions = [...relevantQuestions, ...skillBasedQuestions]
          }

          // Adjust for difficulty
          if (difficulty === "easy") {
            relevantQuestions = relevantQuestions.slice(0, Math.min(count, relevantQuestions.length))
          } else if (difficulty === "hard") {
            // For hard, we'd ideally have more complex questions
            // This is a simplified implementation
            relevantQuestions = [
              ...relevantQuestions,
              "Describe the most complex technical challenge you've faced and how you solved it.",
              "How would you design a system that handles millions of concurrent users?",
              "What's your approach to debugging a critical production issue?",
            ]
          }

          // Return the requested number of questions
          return {
            questions: relevantQuestions.slice(0, count),
          }
        } catch (error) {
          console.error("Error generating interview questions:", error)
          return {
            questions: [
              "Tell me about yourself and your experience.",
              "Why are you interested in this role?",
              "What are your greatest strengths and weaknesses?",
            ],
            error: "Some questions could not be generated. Showing default questions instead.",
          }
        }
      },
    }
  }

  private createJobMarketTool(): Tool {
    return {
      name: "get_job_market_insights",
      description: "Retrieves current job market insights for a specific role",
      parameters: {
        type: "object",
        properties: {
          role: {
            type: "string",
            description: "The job role to get insights for",
          },
          location: {
            type: "string",
            description: "Optional location to filter results",
          },
        },
        required: ["role"],
      },
      execute: async ({ role, location = "United States" }) => {
        try {
          // In a real implementation, this would call an external API
          // For now, we'll return mock data

          const mockInsights: Record<string, any> = {
            "Software Engineer": {
              averageSalary: "$120,000",
              demandTrend: "High and increasing",
              topSkills: ["JavaScript", "React", "Node.js", "Python", "AWS"],
              growthRate: "22% over the next 5 years",
              competitiveSkills: ["Machine Learning", "Cloud Architecture", "DevOps"],
            },
            "Data Scientist": {
              averageSalary: "$135,000",
              demandTrend: "Very high",
              topSkills: ["Python", "SQL", "Machine Learning", "Statistics", "Data Visualization"],
              growthRate: "28% over the next 5 years",
              competitiveSkills: ["Deep Learning", "NLP", "Big Data Technologies"],
            },
            "Product Manager": {
              averageSalary: "$125,000",
              demandTrend: "Steady",
              topSkills: ["Product Strategy", "User Research", "Agile Methodologies", "Data Analysis"],
              growthRate: "10% over the next 5 years",
              competitiveSkills: ["Technical Background", "UX Design", "Growth Hacking"],
            },
          }

          // Default insights if role not found
          const defaultInsights = {
            averageSalary: "$90,000 - $130,000",
            demandTrend: "Varies by location",
            topSkills: ["Communication", "Problem Solving", "Adaptability"],
            growthRate: "Industry average",
            competitiveSkills: ["Leadership", "Project Management", "Technical Knowledge"],
          }

          return {
            role,
            location,
            insights: mockInsights[role] || defaultInsights,
            lastUpdated: new Date().toISOString().split("T")[0],
          }
        } catch (error) {
          console.error("Error fetching job market insights:", error)
          return {
            role,
            location,
            error: "Unable to retrieve job market insights at this time.",
            insights: {
              note: "Please try again later or check industry reports for the most current information.",
            },
          }
        }
      },
    }
  }
}
