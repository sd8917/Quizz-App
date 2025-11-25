# AI Question Generation API

## Overview
Generate quiz questions automatically using Google's Gemini AI. This feature is available only to **premium creators** (users with `creator` or `admin` role).

## Setup

### 1. Install Dependencies
```bash
npm install @google/generative-ai
```

### 2. Environment Configuration
Add to your `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

## API Endpoints

### 1. Generate Questions
**POST** `/api/ai/generate-questions`

Generate multiple-choice questions using AI.

#### Request Headers
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "topic": "JavaScript Event Loop",
  "difficulty": "medium",
  "numberOfQuestions": 6,
  "marks": 1
}
```

**Parameters:**
- `topic` (string, required): The subject/topic for question generation
- `difficulty` (string, required): Must be `easy`, `medium`, or `hard`
- `numberOfQuestions` (integer, required): Number of questions (1-20)
- `marks` (integer, optional): Marks per question (default: 1)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Questions generated successfully",
  "data": {
    "questions": [
      {
        "questionText": "Which planet is closest to the sun?",
        "marks": 1,
        "options": [
          { "text": "Venus", "isCorrect": false },
          { "text": "Mercury", "isCorrect": true },
          { "text": "Earth", "isCorrect": false },
          { "text": "Mars", "isCorrect": false }
        ],
        "explanation": "Mercury is the closest planet to the Sun with an average distance of about 58 million kilometers."
      },
      {
        "questionText": "Which planet is nearest to Earth?",
        "marks": 1,
        "options": [
          { "text": "Venus", "isCorrect": true },
          { "text": "Mercury", "isCorrect": false },
          { "text": "Mars", "isCorrect": false },
          { "text": "Jupiter", "isCorrect": false }
        ],
        "explanation": "Venus is Earth's nearest planetary neighbor, coming as close as 38 million kilometers."
      }
    ],
    "metadata": {
      "topic": "Solar System",
      "difficulty": "medium",
      "totalQuestions": 2,
      "totalMarks": 2,
      "generatedAt": "2025-11-25T10:30:00.000Z",
      "generatedBy": "john_doe"
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Invalid input
```json
{
  "success": false,
  "message": "Only premium creators can use AI question generation"
}
```

**401 Unauthorized** - Not authenticated
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

**403 Forbidden** - Not a creator
```json
{
  "success": false,
  "message": "Access denied"
}
```

**500 Server Error** - AI generation failed
```json
{
  "success": false,
  "message": "Failed to generate questions: Connection timeout"
}
```

### 2. Validate Topic
**POST** `/api/ai/validate-topic`

Check if a topic is appropriate for quiz generation.

#### Request Body
```json
{
  "topic": "Python Programming"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Topic validation completed",
  "data": {
    "topic": "Python Programming",
    "isValid": true,
    "message": "Topic is appropriate"
  }
}
```

## Usage Examples

### Example 1: Generate Easy Questions
```bash
curl -X POST http://localhost:8000/api/ai/generate-questions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Basic HTML",
    "difficulty": "easy",
    "numberOfQuestions": 5,
    "marks": 1
  }'
```

### Example 2: Generate Hard Questions
```bash
curl -X POST http://localhost:8000/api/ai/generate-questions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Advanced React Hooks",
    "difficulty": "hard",
    "numberOfQuestions": 10,
    "marks": 2
  }'
```

### Example 3: JavaScript/Fetch
```javascript
const generateQuestions = async () => {
  const response = await fetch('http://localhost:8000/api/ai/generate-questions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      topic: 'Node.js Streams',
      difficulty: 'medium',
      numberOfQuestions: 8,
      marks: 1
    })
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Generated Questions:', data.data.questions);
    console.log('Metadata:', data.data.metadata);
  } else {
    console.error('Error:', data.message);
  }
};
```

### Example 4: Using with Quiz Creation
```javascript
// Step 1: Generate questions with AI
const aiResponse = await fetch('/api/ai/generate-questions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    topic: 'JavaScript Promises',
    difficulty: 'medium',
    numberOfQuestions: 5,
    marks: 2
  })
});

const { data } = await aiResponse.json();

// Step 2: Transform AI format to your quiz format
const questionsForChannel = data.questions.map(q => ({
  questionText: q.questionText,
  marks: q.marks,
  options: q.options,
  explanation: q.explanation // Optional: store for future reference
}));

// Step 3: Bulk create questions in channel
const quizResponse = await fetch(`/api/quiz/channel/${channelId}/bulk`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    questions: questionsForChannel
  })
});
```

## Features

### ✅ Smart Question Generation
- Generates contextually relevant questions
- Ensures exactly 4 options per question
- Guarantees only one correct answer
- Varies correct answer positions
- Includes explanations for learning

### ✅ Difficulty Levels
- **Easy**: Basic knowledge, fundamental concepts
- **Medium**: Understanding and application of concepts
- **Hard**: Deep understanding, critical thinking

### ✅ Quality Validation
- Validates question structure
- Ensures correct number of questions
- Verifies options format
- Checks for single correct answer

### ✅ Error Handling
- Graceful fallback on AI errors
- Detailed error messages
- JSON parsing validation
- Input sanitization

## Best Practices

1. **Topic Specificity**: Use specific, focused topics
   - ✅ Good: "JavaScript Array Methods"
   - ❌ Too broad: "Programming"

2. **Batch Generation**: Generate multiple questions at once (up to 20)
   - More efficient than single requests
   - Better context for AI

3. **Review Generated Content**: Always review AI-generated questions
   - Check for accuracy
   - Verify explanations
   - Ensure cultural sensitivity

4. **Rate Limiting**: Be mindful of API quotas
   - Gemini has usage limits
   - Cache results when possible

## Limitations

- Maximum 20 questions per request
- Requires active Gemini API key
- Premium creators only
- Subject to Gemini API rate limits
- AI-generated content should be reviewed

## Integration with Existing Quiz System

The AI-generated questions follow your exact format:
```typescript
{
  questionText: string;
  marks: number;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
}
```

This matches your bulk question creation format, making integration seamless.

## Swagger Documentation

View interactive API documentation at:
```
http://localhost:8000/api-docs
```

Look for the "AI Questions" tag in Swagger UI.

## Troubleshooting

### Issue: "GEMINI_API_KEY is not configured"
**Solution**: Add your Gemini API key to `.env` file

### Issue: "Only premium creators can use AI question generation"
**Solution**: Ensure your user has `creator` or `admin` role

### Issue: "Failed to parse AI response"
**Solution**: This is usually temporary. Try again. If persistent, check Gemini API status.

### Issue: "Number of questions must be between 1 and 20"
**Solution**: Reduce `numberOfQuestions` in your request

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify Gemini API key is valid
- Ensure user has correct roles
- Check API rate limits

## Future Enhancements

- [ ] Support for true/false questions
- [ ] Multi-language question generation
- [ ] Custom difficulty parameters
- [ ] Question bank caching
- [ ] Batch topic generation
- [ ] Question quality scoring
