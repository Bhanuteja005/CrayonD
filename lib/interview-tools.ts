import type { Tool } from "@ai-sdk/core";

/**
 * A collection of tools to assist with interview preparation
 */
export class InterviewToolkit {
  private tools: Tool[]

  constructor() {
    this.tools = [this.createQuestionGeneratorTool(), this.createJobMarketTool()]
  }

  getTools(): Tool[] {
    return this.tools
  }

  /**
   * Generates common interview questions for a specific role
   */
  public generateRoleSpecificQuestions(role: string): string[] {
    const commonQuestions = [
      "Tell me about yourself",
      "Why do you want to work for this company?",
      "Where do you see yourself in 5 years?",
      "What are your strengths and weaknesses?",
      "Tell me about a time you faced a challenge at work"
    ];
    
    const roleSpecificQuestions: Record<string, string[]> = {
      "Software Engineer": [
        "What's your experience with algorithms and data structures?",
        "How do you approach debugging a complex issue?",
        "Describe a project where you had to optimize performance",
        "How do you stay up-to-date with the latest technologies?",
        "How would you explain a technical concept to a non-technical person?"
      ],
      "Product Manager": [
        "How do you prioritize features for a product?",
        "Describe a product you launched from concept to release",
        "How do you gather and incorporate user feedback?",
        "How do you work with engineering teams?",
        "Tell me about a time you had to make a difficult product decision"
      ],
      "Data Scientist": [
        "Explain a complex data analysis you performed",
        "How do you validate your models?",
        "What's your experience with big data technologies?",
        "How do you communicate technical findings to stakeholders?",
        "Tell me about a time your analysis led to a significant business decision"
      ],
      "Marketing": [
        "Describe a successful campaign you managed",
        "How do you measure the success of marketing initiatives?",
        "How do you stay current with marketing trends?",
        "Tell me about a time a marketing campaign didn't work as expected",
        "How do you identify and target your audience?"
      ],
      "Sales": [
        "Describe your sales process",
        "How do you handle objections?",
        "Tell me about your biggest sale",
        "How do you build relationships with clients?",
        "How do you stay motivated during a sales slump?"
      ]
    };
    
    // Create a normalized role for lookup
    const normalizedRole = Object.keys(roleSpecificQuestions).find(
      key => role.toLowerCase().includes(key.toLowerCase())
    );
    
    return [
      ...commonQuestions,
      ...(normalizedRole ? roleSpecificQuestions[normalizedRole] : [])
    ];
  }
  
  /**
   * Formats a response using the STAR method
   */
  public formatSTARResponse(input: {
    situation: string;
    task: string;
    action: string;
    result: string;
  }): string {
    return `
      ## STAR Method Response

      ### Situation
      ${input.situation}

      ### Task
      ${input.task}

      ### Action
      ${input.action}

      ### Result
      ${input.result}
    `;
  }
  
  /**
   * Provides feedback on a user's interview answer
   */
  public provideAnswerFeedback(answer: string): string {
    // This would include more sophisticated analysis in a real implementation
    const feedback = {
      strengths: [
        "Good use of specific examples",
        "Clear structure to your response",
        "Effectively highlighted your skills"
      ],
      improvements: [
        "Consider quantifying your results more",
        "Your answer could be more concise",
        "Add more context about the situation"
      ],
      overallRating: "Strong"
    };
    
    return `
      ## Feedback on Your Answer

      ### Strengths
      ${feedback.strengths.map(s => `- ${s}`).join('\n')}

      ### Areas for Improvement
      ${feedback.improvements.map(i => `- ${i}`).join('\n')}

      ### Overall Assessment
      ${feedback.overallRating}
    `;
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
