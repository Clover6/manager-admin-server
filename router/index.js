const express = require('express')
const md5 = require('blueimp-md5')
const UsersModel = require('../model/user')
const CategoryModel = require('../model/category')
const ProductModel = require('../model/productModel')
const RoleModel = require('../model/roleModel')
const pageFilter = require('../api/pageFilter')

const Router = express.Router()

const filter = { password: 0, __v: 0 }

Router.post('/login', (req, res) => {
  const { username, password } = req.body

  UsersModel.findOne({ username, password: md5(password) }, filter).exec((err, users) => {
    if (err) {
      console.error('Anomal login', err)
      res.send({ status: 1, msg: 'Anomal login,Please try again' })
    } else {
      if (!users) {
        res.send({ status: 1, msg: 'Incorrect user or pass' })
      } else {
        res.cookie('userid', users._id, { maxAge: 1000 * 360 * 24 })
        if (users.role_id) {
          RoleModel.findOne({ _id: users.role_id }).exec((err, role) => {
            if (err) {
              console.log('err', err)
              res.send({ status: 2 })
            } else {
              if (role) {
                users._doc.role = role
                res.send({ status: 0, data: users })
              }
            }
          })
        } else {
          users._doc.role = { menus: [] }
          res.send({ status: 0, msg: 'ok login', data: users })
        }
      }
    }
  })
})

Router.post('/manage/user/add', (req, res) => {
  const { username, password } = req.body

  UsersModel.findOne({ username }).exec((err, user) => {
    if (err) {
      console.error('database exception', err)
      res.send({ status: 1, msg: 'database exception' })
    } else {
      if (user) {
        res.send({ status: 1, msg: 'This user exists' })
      } else {
        UsersModel.create({ ...req.body, password: md5(password || '123456') }, err => {
          if (err) {
            res.send({ status: 1, msg: 'add user exception,Please try again' })
          } else {
            res.send({ status: 0, data: user })
          }
        })
      }
    }
  })
})

Router.post('/manage/user/update', (req, res) => {
  const user = req.body
  UsersModel.findOneAndUpdate({ _id: user._id }, user).exec((err, oldUser) => {
    if (err) {
      console.error('update user exception', error)
      res.send({ status: 1, msg: 'update user exception, Please try again' })
    } else {
      const data = Object.assign(oldUser, user)
      res.send({ status: 0, data })
    }
  })
})

Router.post('/manage/user/delete', (req, res) => {
  const { userId } = req.body
  UsersModel.deleteOne({ _id: userId }, err => {
    if (!err) {
      res.send({ status: 0 })
    }
  })
})

// 获取用户信息的路由(根据cookie中的userid)
/*router.get('/user', (req, res) => {
  // 从请求的cookie得到userid
  const userid = req.cookies.userid
  // 如果不存在, 直接返回一个提示信息
  if (!userid) {
    return res.send({status: 1, msg: '请先登陆'})
  }
  // 根据userid查询对应的user
  UsersModel.findOne({_id: userid}, filter)
    .then(user => {
      if (user) {
        res.send({status: 0, data: user})
      } else {
        // 通知浏览器删除userid cookie
        res.clearCookie('userid')
        res.send({status: 1, msg: '请先登陆'})
      }
    })
    .catch(error => {
      console.error('获取用户异常', error)
      res.send({status: 1, msg: '获取用户异常, 请重新尝试'})
    })
})*/

Router.get('/manage/user/list', (req, res) => {
  UsersModel.find({ username: { '$ne': 'admin' } }).exec((err, users) => {
    if (err) {
      console.error('get user list exception', error)
      res.send({ status: 1, msg: 'get user list exception, Please try again' })
    } else {
      RoleModel.find().exec((err, roles) => {
        if (err) {
          res.send({ status: 1, msg: 'no user list' })
        } else {
          res.send({ status: 0, data: { users, roles } })
        }
      })
    }
  })
})



Router.get('/manage/category/list', (req, res) => {
  const parentId = req.query.parentId || '0'

  CategoryModel.find({ parentId }, filter).exec((err, categorys) => {
    if (err) {
      console.error('Anomal category', err)
      res.send({ status: 1, msg: 'Anomal caregory, Please try again' })
    } else {
      if (!categorys) {
        res.send({ status: 1, msg: 'cannot find' })
      } else {
        res.send({ status: 0, data: categorys })
      }
    }
  })
})

Router.get('/manage/category/info', (req, res) => {
  const categoryId = req.query.categoryId

  CategoryModel.findOne({ _id: categoryId }).exec((err, category) => {
    if (err) {
      console.error('Anomal caregory name', error)
      res.send({ status: 1, msg: 'Anomal caregory name, Please try again' })
    } else {
      res.send({ status: 0, data: category })
    }
  })
})

Router.post('/manage/category/add', (req, res) => {
  const { categoryName, parentId } = req.body
  CategoryModel.create({ name: categoryName, parentId: parentId || '0' }, (err, category) => {
    if (err) {
      console.error('Add category exception', error)
      res.send({ status: 1, msg: 'Add category exception, Please try again' })
    } else {
      if (category) {
        res.send({ status: 0, data: category })
      }
    }
  })
})

Router.post('/manage/category/update', (req, res) => {
  const { categoryId, categoryName } = req.body

  CategoryModel.findOneAndUpdate({ _id: categoryId }, { name: categoryName }).exec((err, oldCategory) => {
    if (err) {
      console.error('Update category exception', error)
      res.send({ status: 1, msg: 'Update category exception, Please try again' })
    } else {
      res.send({ status: 0 })
    }
  })
})


Router.post('/manage/product/add', (req, res) => {
  const product = req.body

  ProductModel.create(product, (err, product) => {
    if (err) {
      console.error('add product exception', error)
      res.send({ status: 1, msg: 'add product exception, Please try again' })
    } else {
      res.send({ status: 0, data: product })
    }
  })
})


Router.get('/manage/product/list', (req, res) => {
  const { pageNum, pageSize } = req.query

  ProductModel.find({}).exec((err, products) => {
    if (err) {
      console.error('get is item exception', error)
      res.send({ status: 1, msg: 'get is item exception, Please try again' })
    } else {
      if (products) {
        res.send({ status: 0, data: pageFilter(products, pageNum, pageSize) })
      }
    }
  })
})

Router.get('/manage/product/search', (req, res) => {
  const { pageNum, pageSize, searchName, productName, productDesc } = req.query

  let contition = {}
  if (productName) {
    contition = { name: new RegExp(`^.*${productName}.*$`) }
  } else if (productDesc) {
    contition = { desc: new RegExp(`^.*${productDesc}.*$`) }
  }

  ProductModel.find(contition).exec((err, products) => {
    if (err) {
      console.error('search shoping is exception', error)
      res.send({ status: 1, msg: 'search shoping is exception, Please try again' })
    } else {
      if (products) {
        res.send({ status: 0, data: pageFilter(products, pageNum, pageSize) })
      }
    }
  })
})

Router.post('/manage/product/update', (req, res) => {
  const product = req.body
  ProductModel.findOneAndUpdate({ _id: product._id }, product).exec((err, oldProduct) => {
    if (err) {
      console.error('update poduct exception', error)
      res.send({ status: 1, msg: 'update poduct exception, Please try again' })
    } else {
      res.send({ status: 0 })
    }
  })
})

Router.post('/manage/product/updateStatus', (req, res) => {
  const { productId, status } = req.body
  ProductModel.findOneAndUpdate({ _id: productId }, { status }).exec((err, oldProduct) => {
    if (err) {
      console.error('updateStatus error', error)
      res.send({ status: 1, msg: 'updateStatus error, Please try again' })
    } else {
      res.send({ status: 0 })
    }
  })
})


Router.post('/manage/role/add', (req, res) => {
  const { roleName } = req.body
  RoleModel.create({ name: roleName }, (err, role) => {
    if (err) {
      console.error('add role excepiton', error)
      res.send({ status: 1, msg: 'add role excepiton, Please try again' })
    } else {
      res.send({ status: 0, data: role })
    }
  })
})

Router.get('/manage/role/list', (req, res) => {
  RoleModel.find().exec((err, roles) => {
    if (err) {
      console.error('get the role list exception', error)
      res.send({ status: 1, msg: 'get the role list exception, Please try again' })
    } else {
      res.send({ status: 0, data: roles })
    }
  })
})


Router.post('/manage/role/update', (req, res) => {
  const role = req.body
  role.auth_time = Date.now()
  RoleModel.findOneAndUpdate({ _id: role._id }, role).exec((err, oldRle) => {
    if (err) {
      console.error('update the role exception', error)
      res.send({ status: 1, msg: 'update the role exception,  Please try again' })
    } else {
      res.send({ status: 0, data: { ...oldRole._doc, ...role } })
    }
  })
})





require('../api/update.js')(Router)
module.exports = Router