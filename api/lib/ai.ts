import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

const EDIT_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';
const ANALYZE_MODEL = 'google/gemma-2-9b-it:free';

const LATEX_SYSTEM_PROMPT = `You are a professional resume editor specializing in LaTeX resumes. RULES - you must follow all of these without exception:
1. Only modify text content inside \\resumeItem{} and \\resumeSubheading{} commands
2. Never add, remove, or change any LaTeX commands, packages, or structure
3. Never invent experience, skills, dates, or roles that aren't already there
4. Preserve all whitespace and formatting exactly as-is outside of text content
5. Return ONLY the complete updated LaTeX document, no explanation

When a job description is provided:
- Identify keywords and skills from the job description
- Rephrase existing bullet points to naturally include those keywords
- Prioritize quantifiable impact statements (numbers, percentages, scale)
- Match the seniority and tone of the job posting`;

export async function editLatex(latex: string, prompt: string, jobDescription = '') {
  let fullPrompt = prompt;
  if (jobDescription?.trim()) {
    fullPrompt = 'IMPORTANT - JOB DESCRIPTION CONTEXT:\n' + jobDescription.trim() + '\n\nUSER REQUEST: ' + prompt;
  }

  const response = await openai.chat.completions.create({
    model: EDIT_MODEL,
    messages: [
      { role: 'system', content: LATEX_SYSTEM_PROMPT },
      { role: 'user', content: 'Current LaTeX:\n' + latex + '\n\n' + fullPrompt }
    ],
    temperature: 0.1,
    max_tokens: 16000
  });

  let updatedLatex = response.choices[0]?.message?.content?.trim() || '';
  updatedLatex = updatedLatex.replace(/^```latex\s*/, '').replace(/```$/, '');
  if (!updatedLatex) throw new Error('Empty response from AI');
  return { updatedLatex };
}

export async function analyzeJob(jobDescription: string) {
  const response = await openai.chat.completions.create({
    model: ANALYZE_MODEL,
    messages: [
      { role: 'system', content: 'Extract structured data from job posting. Return ONLY valid JSON with keys: keywords[], requiredSkills[], preferredSkills[], experienceLevel, keyResponsibilities[], qualifications[], industry, suggestedResumeSections[]' },
      { role: 'user', content: 'Analyze this job description:\n\n' + jobDescription }
    ],
    temperature: 0.3,
    max_tokens: 4000
  });

  let text = response.choices[0]?.message?.content?.trim() || '';
  text = text.replace(/^```json\s*/, '').replace(/```$/, '');
  try {
    return JSON.parse(text);
  } catch {
    return { rawAnalysis: text };
  }
}
