# Quiz Submission Tracking System

## Overview
Users can only submit a quiz **once per channel**. Creators and admins can view all submissions for their channels.

---

## Features

### ✅ Single Submission Per User
- Users can submit a quiz only once per channel
- Prevents cheating and multiple attempts
- Database-level unique constraint ensures integrity
- Automatic attempt tracking

### ✅ Submission Status Check
- Check if user has already submitted before showing quiz
- Frontend can hide submit button if already submitted
- Shows previous score and submission time

### ✅ Creator/Admin Submission Tracking
- View all submissions for a channel
- See who submitted, when, and their scores
- Track quiz participation and performance

---

## API Endpoints

### 1. Submit Quiz (User)
**POST** `/api/quiz/channel/:channelId/submit`

Submit answers for a quiz. Can only be done **once per channel**.

#### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body
```json
{
  "answers": [
    {
      "questionId": "673fbc123456789012345678",
      "selectedOption": "Option text"
    },
    {
      "questionId": "673fbc123456789012345679",
      "selectedOption": "Another option"
    }
  ]
}
```

#### Response (200 OK) - First Submission
```json
{
  "success": true,
  "message": "Quiz submitted successfully",
  "data": {
    "attemptId": "674abc123456789012345678",
    "score": 8,
    "total": 10,
    "percentage": 80,
    "submittedAt": "2025-11-26T10:30:00.000Z",
    "message": "Quiz submitted successfully. You cannot resubmit this test."
  }
}
```

#### Response (400 Bad Request) - Resubmission Attempt
```json
{
  "success": false,
  "message": "You have already submitted this quiz. Multiple submissions are not allowed."
}
```

---

### 2. Check Submission Status (User)
**GET** `/api/quiz/channel/:channelId/submission-status`

Check if current user has already submitted this quiz.

#### Request Headers
```
Authorization: Bearer <token>
```

#### Response - Not Submitted
```json
{
  "success": true,
  "message": "User has not submitted this quiz yet",
  "data": {
    "hasSubmitted": false
  }
}
```

#### Response - Already Submitted
```json
{
  "success": true,
  "message": "User has already submitted this quiz",
  "data": {
    "hasSubmitted": true,
    "attempt": {
      "attemptId": "674abc123456789012345678",
      "score": 8,
      "total": 10,
      "percentage": 80,
      "submittedAt": "2025-11-26T10:30:00.000Z"
    }
  }
}
```

---

### 3. Get Channel Submissions (Creator/Admin Only)
**GET** `/api/quiz/channel/:channelId/submissions`

View all quiz submissions for a channel. Only accessible by channel owner or admins.

#### Request Headers
```
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Channel submissions retrieved successfully",
  "data": {
    "channelId": "673fbc123456789012345670",
    "totalSubmissions": 15,
    "submissions": [
      {
        "_id": "674abc123456789012345678",
        "userId": {
          "_id": "673abc123456789012345671",
          "username": "john_doe",
          "email": "john@example.com"
        },
        "score": 9,
        "total": 10,
        "percentage": 90,
        "submittedAt": "2025-11-26T10:30:00.000Z",
        "answers": [
          {
            "questionId": "673fbc123456789012345678",
            "selectedOption": "Correct Answer",
            "isCorrect": true
          }
        ]
      },
      {
        "_id": "674abc123456789012345679",
        "userId": {
          "_id": "673abc123456789012345672",
          "username": "jane_smith",
          "email": "jane@example.com"
        },
        "score": 7,
        "total": 10,
        "percentage": 70,
        "submittedAt": "2025-11-26T09:15:00.000Z",
        "answers": [...]
      }
    ]
  }
}
```

#### Response (403 Forbidden) - Not Owner/Admin
```json
{
  "success": false,
  "message": "Only channel owner or admins can view submissions"
}
```

---

## Usage Examples

### Example 1: Check Before Showing Quiz
```javascript
// Check if user already submitted
const checkStatus = async (channelId) => {
  const response = await fetch(
    `http://localhost:8000/api/quiz/channel/${channelId}/submission-status`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  if (data.data.hasSubmitted) {
    // Show previous results
    console.log('You already submitted this quiz!');
    console.log('Your score:', data.data.attempt.score);
    console.log('Percentage:', data.data.attempt.percentage);
    return false; // Don't allow quiz attempt
  }
  
  return true; // Allow quiz attempt
};
```

### Example 2: Submit Quiz
```javascript
const submitQuiz = async (channelId, answers) => {
  try {
    const response = await fetch(
      `http://localhost:8000/api/quiz/channel/${channelId}/submit`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Quiz submitted!');
      console.log('Score:', data.data.score, '/', data.data.total);
      console.log('Percentage:', data.data.percentage + '%');
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Submission failed:', error);
  }
};
```

### Example 3: View Submissions (Creator)
```javascript
const viewSubmissions = async (channelId) => {
  const response = await fetch(
    `http://localhost:8000/api/quiz/channel/${channelId}/submissions`,
    {
      headers: {
        'Authorization': `Bearer ${creatorToken}`
      }
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Total Submissions:', data.data.totalSubmissions);
    
    data.data.submissions.forEach((submission, index) => {
      console.log(`${index + 1}. ${submission.userId.username}`);
      console.log(`   Score: ${submission.score}/${submission.total} (${submission.percentage}%)`);
      console.log(`   Submitted: ${new Date(submission.submittedAt).toLocaleString()}`);
    });
  }
};
```

---

## Frontend Implementation Guide

### Quiz Flow

1. **Load Quiz Page**
   ```javascript
   // Step 1: Check submission status
   const status = await checkSubmissionStatus(channelId);
   
   if (status.hasSubmitted) {
     // Show results page instead of quiz
     showPreviousResults(status.attempt);
     return;
   }
   
   // Step 2: Load questions
   const questions = await fetchQuestions(channelId);
   showQuizForm(questions);
   ```

2. **Submit Quiz**
   ```javascript
   const handleSubmit = async (answers) => {
     try {
       const result = await submitQuiz(channelId, answers);
       showResults(result);
       
       // Disable form to prevent resubmission
       disableQuizForm();
     } catch (error) {
       if (error.message.includes('already submitted')) {
         alert('You have already submitted this quiz!');
       }
     }
   };
   ```

3. **Creator Dashboard**
   ```javascript
   const CreatorDashboard = () => {
     const [submissions, setSubmissions] = useState([]);
     
     useEffect(() => {
       fetchSubmissions(channelId).then(data => {
         setSubmissions(data.submissions);
       });
     }, [channelId]);
     
     return (
       <div>
         <h2>Quiz Submissions ({submissions.length})</h2>
         <table>
           <thead>
             <tr>
               <th>User</th>
               <th>Score</th>
               <th>Percentage</th>
               <th>Submitted</th>
             </tr>
           </thead>
           <tbody>
             {submissions.map(sub => (
               <tr key={sub._id}>
                 <td>{sub.userId.username}</td>
                 <td>{sub.score}/{sub.total}</td>
                 <td>{sub.percentage}%</td>
                 <td>{new Date(sub.submittedAt).toLocaleString()}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     );
   };
   ```

---

## Database Schema

### Attempt Model
```typescript
{
  userId: ObjectId (ref: User),
  channelId: ObjectId (ref: Channel),
  score: Number,
  total: Number,
  percentage: Number,
  answers: [
    {
      questionId: ObjectId,
      selectedOption: String,
      isCorrect: Boolean
    }
  ],
  startedAt: Date,
  submittedAt: Date,
  timestamps: true
}

// Unique Index: userId + channelId (prevents duplicate submissions)
```

---

## Security Features

### ✅ Database-Level Protection
- Unique index on `userId + channelId`
- Prevents duplicate submissions even with concurrent requests
- Database enforces constraint automatically

### ✅ Application-Level Protection
- Check existing attempt before processing
- Clear error messages for resubmission attempts
- Proper authorization for viewing submissions

### ✅ Role-Based Access
- Only channel owner/admin can view submissions
- Users can only view their own submission status
- Proper permission checks at service layer

---

## Error Handling

### Duplicate Submission
```javascript
try {
  await submitQuiz(channelId, answers);
} catch (error) {
  if (error.code === 11000) {
    // MongoDB duplicate key error
    alert('You have already submitted this quiz!');
  }
}
```

### Permission Denied
```javascript
try {
  await viewSubmissions(channelId);
} catch (error) {
  if (error.status === 403) {
    alert('You do not have permission to view submissions');
  }
}
```

---

## Testing

### Test Scenario 1: Prevent Resubmission
```bash
# First submission (should succeed)
curl -X POST http://localhost:8000/api/quiz/channel/CHANNEL_ID/submit \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answers": [{"questionId": "Q1", "selectedOption": "A"}]}'

# Second submission (should fail)
curl -X POST http://localhost:8000/api/quiz/channel/CHANNEL_ID/submit \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answers": [{"questionId": "Q1", "selectedOption": "B"}]}'
```

### Test Scenario 2: Check Status
```bash
curl http://localhost:8000/api/quiz/channel/CHANNEL_ID/submission-status \
  -H "Authorization: Bearer USER_TOKEN"
```

### Test Scenario 3: View Submissions
```bash
curl http://localhost:8000/api/quiz/channel/CHANNEL_ID/submissions \
  -H "Authorization: Bearer CREATOR_TOKEN"
```

---

## Benefits

1. **Fair Testing**: Prevents cheating through multiple attempts
2. **Progress Tracking**: Users can see their submission history
3. **Analytics**: Creators can analyze quiz performance
4. **Data Integrity**: Database constraints ensure clean data
5. **User Experience**: Clear feedback about submission status

---

## Future Enhancements

- [ ] Allow configurable attempt limits (1, 2, or unlimited)
- [ ] Time-limited retakes (e.g., retry after 24 hours)
- [ ] Export submissions as CSV/Excel
- [ ] Detailed analytics dashboard
- [ ] Email notifications to creators on new submissions
- [ ] Individual answer review for creators
- [ ] Submission deadlines
