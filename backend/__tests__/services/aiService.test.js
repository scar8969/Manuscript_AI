// Mock must be set up before requiring aiService
const mockCreate = jest.fn();

jest.mock('openai', () => {
  const MockConstructor = function() {
    return {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
  };
  MockConstructor.default = MockConstructor;
  return MockConstructor;
});

const { editLatex, analyzeJob } = require('../../services/aiService');

describe('aiService', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  describe('editLatex', () => {
    it('calls OpenAI with correct model and messages', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '\\documentclass{article}\n\\begin{document}\nUpdated\n\\end{document}' } }]
      });

      await editLatex('\\documentclass{article}', 'Make it better');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          temperature: 0.1,
          max_tokens: 16000
        })
      );
    });

    it('strips ```latex code fences from response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '```latex\n\\documentclass{article}\n```' } }]
      });

      const result = await editLatex('\\documentclass{article}', 'update');

      expect(result.updatedLatex.trim()).toBe('\\documentclass{article}');
    });

    it('strips trailing ``` from response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '\\documentclass{article}' } }]
      });

      const result = await editLatex('\\documentclass{article}', 'update');

      expect(result.updatedLatex).toBe('\\documentclass{article}');
    });

    it('throws AI_ERROR with originalLatex on API failure', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limit'));

      await expect(editLatex('\\original{latex}', 'edit')).rejects.toEqual(
        expect.objectContaining({
          type: 'AI_ERROR',
          message: 'API rate limit',
          originalLatex: '\\original{latex}'
        })
      );
    });

    it('throws AI_ERROR when response is empty', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '' } }]
      });

      await expect(editLatex('\\latex', 'edit')).rejects.toEqual(
        expect.objectContaining({
          type: 'AI_ERROR',
          message: 'Empty response from AI'
        })
      );
    });

    it('includes job description in prompt when provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '\\updated latex' } }]
      });

      await editLatex('\\latex', 'Tailor resume', 'Senior React Developer job');

      const call = mockCreate.mock.calls[0][0];
      const userMessage = call.messages[1].content;
      expect(userMessage).toContain('JOB DESCRIPTION CONTEXT');
      expect(userMessage).toContain('Senior React Developer job');
      expect(userMessage).toContain('USER REQUEST');
    });

    it('does not include job context when jobDescription is empty', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '\\updated latex' } }]
      });

      await editLatex('\\latex', 'edit', '');

      const call = mockCreate.mock.calls[0][0];
      const userMessage = call.messages[1].content;
      expect(userMessage).not.toContain('JOB DESCRIPTION CONTEXT');
    });
  });

  describe('analyzeJob', () => {
    it('calls OpenAI with analyze model and returns parsed JSON', async () => {
      const analysisResult = {
        keywords: ['react', 'typescript'],
        requiredSkills: ['React', 'TypeScript'],
        preferredSkills: ['GraphQL'],
        experienceLevel: 'Senior',
        keyResponsibilities: ['Build features'],
        qualifications: ['5+ years'],
        industry: 'Technology',
        suggestedResumeSections: ['Skills', 'Experience']
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(analysisResult) } }]
      });

      const result = await analyzeJob('Senior React Developer position');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'google/gemma-2-9b-it:free',
          temperature: 0.3,
          max_tokens: 4000
        })
      );
      expect(result.keywords).toEqual(['react', 'typescript']);
    });

    it('strips ```json fences from response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '```json\n{"keywords": ["test"]}\n```' } }]
      });

      const result = await analyzeJob('job');

      expect(result.keywords).toEqual(['test']);
    });

    it('returns rawAnalysis when response is not valid JSON', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'This is not JSON at all' } }]
      });

      const result = await analyzeJob('job');

      expect(result.rawAnalysis).toBe('This is not JSON at all');
    });

    it('throws AI_ERROR on API failure', async () => {
      mockCreate.mockRejectedValue(new Error('Network error'));

      await expect(analyzeJob('job')).rejects.toEqual(
        expect.objectContaining({
          type: 'AI_ERROR',
          message: 'Network error'
        })
      );
    });
  });
});
