import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from '../utils/apiError';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use the correct model name for v1 API
const MODEL_NAME = "gemini-2.5-flash";

export interface AIGeneratedQuestion {
  questionText: string;
  marks: number;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
}

export interface GenerateQuestionsRequest {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numberOfQuestions: number;
  marks?: number;
}

export class AIService {
  /**
   * Generate multiple-choice questions using Gemini AI
   */
  async generateQuestions(params: GenerateQuestionsRequest): Promise<AIGeneratedQuestion[]> {
    if (!process.env.GEMINI_API_KEY) {
      throw new ApiError(500, 'GEMINI_API_KEY is not configured');
    }

    const { topic, difficulty, numberOfQuestions, marks = 1 } = params;

    // Validate inputs
    if (numberOfQuestions < 1 || numberOfQuestions > 20) {
      throw new ApiError(400, 'Number of questions must be between 1 and 20');
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new ApiError(400, 'Difficulty must be easy, medium, or hard');
    }

    if (!topic || topic.trim().length === 0) {
      throw new ApiError(400, 'Topic is required');
    }

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const prompt = `
You are an expert quiz question generator. Generate exactly ${numberOfQuestions} multiple-choice questions.

Topic: ${topic}
Difficulty: ${difficulty}
Marks per question: ${marks}

Requirements:
1. Each question must have exactly 4 options
2. Only ONE option should be correct (isCorrect: true)
3. Questions should be clear, unambiguous, and well-structured
4. Options should be plausible and not obviously wrong
5. Include a brief explanation for the correct answer
6. Vary the position of correct answers (don't always make it the first or last option)
7. For ${difficulty} difficulty: ${this.getDifficultyGuidelines(difficulty)}

Return ONLY valid JSON in this exact format (no markdown, no code blocks, just pure JSON):
{
  "questions": [
    {
      "questionText": "Question here?",
      "marks": ${marks},
      "options": [
        { "text": "Option 1", "isCorrect": false },
        { "text": "Option 2", "isCorrect": true },
        { "text": "Option 3", "isCorrect": false },
        { "text": "Option 4", "isCorrect": false }
      ],
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Clean the response (remove markdown code blocks if present)
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }

      // Parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Raw AI Response:', text);
        throw new ApiError(500, 'Failed to parse AI response. Please try again.');
      }

      // Validate structure
      if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
        throw new ApiError(500, 'Invalid AI response structure');
      }

      // Validate each question
      const validatedQuestions = parsedData.questions.map((q: any, index: number) => {
        if (!q.questionText || !q.options || !Array.isArray(q.options)) {
          throw new ApiError(500, `Invalid question structure at index ${index}`);
        }

        if (q.options.length !== 4) {
          throw new ApiError(500, `Question ${index + 1} must have exactly 4 options`);
        }

        const correctCount = q.options.filter((opt: any) => opt.isCorrect === true).length;
        if (correctCount !== 1) {
          throw new ApiError(500, `Question ${index + 1} must have exactly one correct answer`);
        }

        return {
          questionText: q.questionText,
          marks: marks,
          options: q.options.map((opt: any) => ({
            text: opt.text,
            isCorrect: opt.isCorrect === true
          })),
          explanation: q.explanation || ''
        };
      });

      if (validatedQuestions.length !== numberOfQuestions) {
        throw new ApiError(500, `Expected ${numberOfQuestions} questions but received ${validatedQuestions.length}`);
      }

      return validatedQuestions;

    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('AI Generation Error:', error);
      throw new ApiError(500, `Failed to generate questions: ${error.message}`);
    }
  }

  /**
   * Get difficulty-specific guidelines for question generation
   */
  private getDifficultyGuidelines(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return 'Questions should test basic knowledge and fundamental concepts. Use straightforward language.';
      case 'medium':
        return 'Questions should require understanding and application of concepts. Include some analytical thinking.';
      case 'hard':
        return 'Questions should test deep understanding, critical thinking, and ability to apply knowledge in complex scenarios.';
      default:
        return 'Questions should be appropriate for the topic.';
    }
  }

  /**
   * Validate if a topic is appropriate for question generation
   */
  async validateTopic(topic: string): Promise<boolean> {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      const prompt = `
Is "${topic}" an appropriate and safe topic for generating educational quiz questions? 
Consider: educational value, appropriateness, clarity.
Respond with only "yes" or "no".
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim().toLowerCase();
      
      return response.includes('yes');
    } catch (error) {
      console.error('Topic validation error:', error);
      return true; // Default to allowing if validation fails
    }
  }
}

export default new AIService();
