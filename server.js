const express = require('express')
const cookieParser = require('cookie-parser')
const db = require('./api/db')
const router = require('./router')
const app = express()

const fs=require('fs')

app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(cookieParser())
app.use('', router)



db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function () {
  console.log('database connection sucess')
  app.listen(4000, () => {
    console.log('Server started successfully, please visit: http://localhost:4000')
  })
})
