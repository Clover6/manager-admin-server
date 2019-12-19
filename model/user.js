const mongoose = require('mongoose')
const md5 = require('blueimp-md5')

const userSchema = mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  phone: String,
  email: String,
  create_time: { type: Number, default: Date.now },
  role_id: String
})

const UsersModel = mongoose.model('users', userSchema)

const userState = new UsersModel({ username: 'admin', password: md5('admin') })
UsersModel.findOne({ username: 'admin' }).exec((err, users) => {
  if (err) return handleError(err)
  if (!users) {
    UsersModel.create(userState, err => {
      if (err) return handleError(err)
      console.log('initialize user: username: admin password: admin')
    })
  }
})

module.exports = UsersModel