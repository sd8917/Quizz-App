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