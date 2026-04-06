const OpenAI = require('openai');

// Using OpenRouter for access to multiple free/low-cost models
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1'
});

// Models: fallback chain if one is rate-limited or unavailable
const EDIT_MODELS = [
  'qwen/qwen3.6-plus:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'qwen/qwen3-coder:free'
];
const ANALYZE_MODELS = [
  'qwen/qwen3.6-plus:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'qwen/qwen3-coder:free'
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callWithFallback(models, messages, options) {
  let lastError;
  for (const model of models) {
    try {
      console.log(`[ai] Trying model: ${model}`);
      const response = await openai.chat.completions.create({
        model,
        messages,
        ...options
      });
      return response;
    } catch (error) {
      lastError = error;
      const isRetryable = error.status === 429 || error.status === 404 || error.code === '429' || error.code === '404';
      console.error(`[ai] ${model} failed: ${error.status || error.code} - ${error.message}`);
      if (!isRetryable) throw error;
      await sleep(3000);
    }
  }
  throw lastError;
}

const LATEX_SYSTEM_PROMPT = 'You are a professional resume editor specializing in LaTeX resumes. RULES - you must follow all of these without exception:\n1. Only modify text content inside \\resumeItem{} and \\resumeSubheading{} commands\n2. Never add, remove, or change any LaTeX commands, packages, or structure\n3. Never invent experience, skills, dates, or roles that aren\'t already there\n4. Preserve all whitespace and formatting exactly as-is outside of text content\n5. Return ONLY the complete updated LaTeX document, no explanation\n\nWhen a job description is provided:\n- Identify keywords and skills from the job description\n- Rephrase existing bullet points to naturally include those keywords\n- Prioritize quantifiable impact statements (numbers, percentages, scale)\n- Match the seniority and tone of the job posting';

async function editLatex(latex, prompt, jobDescription = '') {
  try {
    let fullPrompt = prompt;

    if (jobDescription && jobDescription.trim()) {
      fullPrompt = 'IMPORTANT - JOB DESCRIPTION CONTEXT:\n' + jobDescription.trim() + '\n\nUSER REQUEST: ' + prompt + '\n\nWhen tailoring to this job, match existing resume skills/experience to the job requirements above.';
    }

    const response = await callWithFallback(
      EDIT_MODELS,
      [
        { role: 'system', content: LATEX_SYSTEM_PROMPT },
        { role: 'user', content: 'Current LaTeX:\n' + latex + '\n\n' + fullPrompt }
      ],
      { temperature: 0.1, max_tokens: 16000 }
    );

    let updatedLatex = response.choices[0]?.message?.content?.trim();

    if (updatedLatex) {
      updatedLatex = updatedLatex.replace(/^```latex\s*/, '').replace(/```$/, '');
    }

    if (!updatedLatex) {
      throw new Error('Empty response from AI');
    }

    return { updatedLatex };
  } catch (error) {
    console.error('AI Service error:', error.message);
    throw {
      type: 'AI_ERROR',
      message: error.message || 'AI service failed',
      originalLatex: latex
    };
  }
}

const ANALYSIS_SYSTEM_PROMPT = 'You are a job description analyzer. Extract structured data from job posting. Return ONLY valid JSON with keys: keywords[], requiredSkills[], preferredSkills[], experienceLevel, keyResponsibilities[], qualifications[], industry, suggestedResumeSections[]';

async function analyzeJob(jobDescription) {
  try {
    const response = await callWithFallback(
      ANALYZE_MODELS,
      [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: 'Analyze this job description:\n\n' + jobDescription }
      ],
      { temperature: 0.3, max_tokens: 4000 }
    );

    let analysisText = response.choices[0]?.message?.content?.trim();

    if (analysisText) {
      analysisText = analysisText.replace(/^```json\s*/, '').replace(/```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(analysisText);
    } catch {
      parsed = { rawAnalysis: analysisText };
    }

    return parsed;
  } catch (error) {
    console.error('AI Analysis error:', error.message);
    throw {
      type: 'AI_ERROR',
      message: error.message || 'AI analysis failed'
    };
  }
}

module.exports = {
  editLatex,
  analyzeJob
};
