// Role hierarchy: user < creator < admin
// user: can take tests/quizzes
// creator: can create tests, questions, and invite users to channels
// admin: full system access (manage all channels, users, roles)
export const ROLES = {
  USER: 'user',
  CREATOR: 'creator',
  ADMIN: 'admin',
};
