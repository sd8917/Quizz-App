const user = [
  {
    user: {
      _id: '68fcb21a949edfd473849ef0',
      email: 'sudhanshuraj89@gmail.com',
    },
    role: 'admin',
    _id: '68fcb32e949edfd473849ef8'
  },
  {
    user: {
      _id: '68fcb21a949edfd473849ef0',
      email: 'sudhanshuraj89@gmail.com',
    },
    role: 'team',
    _id: '68fcb32e949edfd473849ef8'
  }
]

console.log("user testing obj ", user)

console.log("user : ", user.find((m) => m.role=="admin"))

// user 1
{
    "_id": "6914103d2e963a2b61550ac6",
    "username": "user1",
    "email": "mfsi.sudhanshuk@gmail.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTQxMDNkMmU5NjNhMmI2MTU1MGFjNiIsImlhdCI6MTc2MjkyMjU1OCwiZXhwIjoxNzY1NTE0NTU4fQ.6FRZJ1v-NMt8aWRBFizS8kA6HgPtmkEIMiNlx4oP1ho"
}
// admin 1
{
    "_id": "68fcb21a949edfd473849ef0",
    "username": "sudhanshu89",
    "email": "sudhanshuraj89@gmail.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZmNiMjFhOTQ5ZWRmZDQ3Mzg0OWVmMCIsImlhdCI6MTc2Mjg4ODQzOSwiZXhwIjoxNzY1NDgwNDM5fQ.r6ZrP5KqFFvzVqQnMMyPCrX0MMjZ9yx_q85sUQUlxoA"
}
