# Database Schema Diagram (ERD)

Below is a textual Entity-Relationship Diagram (ERD) for the Quizz-App backend. You can use this as a reference for database structure, relationships, and for generating a visual diagram in tools like dbdiagram.io, Lucidchart, or draw.io.

---

## Entities & Relationships

```
[User] <|--o{ [Channel] : owner
[User] o--o{ [ChannelMember] : members
[User] o--o{ [Question] : createdBy
[User] o--o{ [Attempt] : userId
[User] o--o{ [Feedback] : userId
[User] o--o{ [RefreshToken] : userId
[User] o--o{ [PasswordReset] : userId

[Channel] o--o{ [Question] : channelId
[Channel] o--o{ [Attempt] : channelId
[Channel] o--o{ [Feedback] : channelId

[Question] o--o{ [AttemptAnswer] : questionId

// Entities
entity User {
  _id ObjectId PK
  username string
  email string
  password string
  roles [string]
  googleId string
  provider string
  isActive boolean
  premium boolean
  createdAt Date
  updatedAt Date
}

entity Channel {
  _id ObjectId PK
  name string
  description string
  owner ObjectId FK -> User._id
  isPublic boolean
  isArchived boolean
  archivedAt Date
  totalQuestions number
  duration number
  passingScore number
  pointsPerQuestion number
  createdAt Date
  updatedAt Date
}

entity ChannelMember {
  channelId ObjectId FK -> Channel._id
  user ObjectId FK -> User._id
  role enum('admin','team','creator')
}

entity Question {
  _id ObjectId PK
  channelId ObjectId FK -> Channel._id
  createdBy ObjectId FK -> User._id
  questionText string
  options [Option]
  marks number
  createdAt Date
  updatedAt Date
}

entity Option {
  text string
  isCorrect boolean
}

entity Attempt {
  _id ObjectId PK
  userId ObjectId FK -> User._id
  channelId ObjectId FK -> Channel._id
  answers [AttemptAnswer]
  score number
  percentage number
  submittedAt Date
}

entity AttemptAnswer {
  questionId ObjectId FK -> Question._id
  selectedOption string
  isCorrect boolean
}

entity Feedback {
  _id ObjectId PK
  userId ObjectId FK -> User._id
  channelId ObjectId FK -> Channel._id (optional)
  message string
  rating number
  createdAt Date
}

entity RefreshToken {
  _id ObjectId PK
  userId ObjectId FK -> User._id
  token string
  expiresAt Date
  isRevoked boolean
}

entity PasswordReset {
  _id ObjectId PK
  userId ObjectId FK -> User._id
  token string
  expiresAt Date
  isUsed boolean
  ipAddress string
  userAgent string
}
```

---

## How to Visualize
- Copy the above code block into [dbdiagram.io](https://dbdiagram.io) (choose MongoDB or generic SQL mode)
- Or use Lucidchart/draw.io to draw boxes and connect as shown

**Legend:**
- `o--o{` = one-to-many
- `<|--o{` = one-to-many (ownership)
- `PK` = Primary Key
- `FK` = Foreign Key
- `[Type]` = Array of Type

---

**Tip:**
- This schema is designed for MongoDB (document-based), but the relationships are shown for clarity.
- Embedded arrays (like `options` in `Question`, `answers` in `Attempt`) are modeled as subdocuments.
