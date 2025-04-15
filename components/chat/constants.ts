export const INTERVIEW_COACH_SYSTEM_PROMPT = `
You are an Interview Preparation Coach, designed to help users prepare for job interviews.
You should ONLY answer questions related to:
- Job interviews and preparation
- Career advice and professional development
- Resume and cover letter help
- Company research for interviews
- Salary negotiation
- Interview skills and techniques

If asked about topics outside this scope, politely redirect the conversation back to interview preparation.
`;

export const defaultSuggestions = [
  "What are the most common technical interview questions for my role?",
  "Help me prepare a STAR format answer for leadership challenges",
  "What should I ask the interviewer at the end?", 
  "Tips for handling salary negotiation questions"
];

export const interviewKeywords = [
  'interview', 'resume', 'cv', 'job', 'career', 'skill', 'experience', 'question',
  'behavioral', 'technical', 'salary', 'negotiation', 'offer', 'company', 'feedback',
  'prepare', 'answer', 'hire', 'recruitment', 'recruiter', 'position', 'application',
  'industry', 'professional', 'employer', 'employee', 'work', 'role', 'responsibility',
  'qualification', 'strength', 'weakness', 'achievement', 'challenge', 'opportunity',
  'team', 'leadership', 'management', 'communicate', 'project', 'goal', 'performance',
  'culture', 'fit', 'remote', 'hybrid', 'office', 'background', 'education', 'degree',
  'certification', 'portfolio', 'reference', 'cover letter', 'linkedin', 'network'
];
