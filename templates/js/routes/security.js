'use strict'


const asyncify = require('express-asyncify')
const express = require('express')
const passport = require('passport')
const middlewareAuth = require('../middleware/auth')

const app = asyncify(express.Router())


app.post('/login',passport.authenticate('json'),async (req, res, next) => {
 res.json(Object.assign({success: true}, req.user))
})

app.post('/isLogin',middlewareAuth ,(req, res) => {
  res.json({success:true, login: true})
})

app.post('/logout', function(req, res){
  req.logout()
  res.send({})
})


module.exports = app