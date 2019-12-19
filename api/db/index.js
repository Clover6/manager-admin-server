const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/admin_server',
  { useNewUrlParser: true })
mongoose.set('useFindAndModify', false)
const db = mongoose.connection

module.exports = db