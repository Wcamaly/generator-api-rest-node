'use strict'
const express = require('express')
const path = require('path')
const logger = require('morgan')
const bodyParser = require('body-parser')
const passport = require('passport')
const chalk = require('chalk')
const session = require('express-session')
const asyncify = require('express-asyncify')
const passportConfig = require('./configs/passport-config')
const index = require('./routes/index')
const users = require('./routes/users')
const security = require('./routes/security')
const middlewareAuth = require('./middleware/auth')


const app = asyncify(express())

// secret to session

const secret = process.env.SECRET_SESSION || 'kasjdhaskjdhaskj'


// static confic files
app.use(express.static(path.join(__dirname, 'public')))


app.use(logger('dev'))

app.use(session({ secret: secret}))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(passportConfig(passport))
app.use(passport.session())

app.use('/', index)
app.use('/security', security)
app.use('/users',middlewareAuth , users)

// Actualization express not generate Page not found
app.use('*', function(req, res, next) {
  let err = new Error('Page not found');
  err.status = 404;
  next(err);
});

// catch error handler, you can personalization those error
app.use((err, req, res, next) => {

  if (err.message.match(/not found/)) {
    return res.status(404).send({error: err.message})
  }

  if (err.message.match(/not authorized/) || err.message.match(/authorization token/)) {
    return res.status(401).send({error: err.message})
  }

  if (err.message.match(/Permission denied/)) {
    return res.status(403).send({error: err.message})
  }

  res.status(500).send({error: err.message})
})


module.exports = app
