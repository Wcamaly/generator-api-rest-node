'use strict'
const JsonStrategy = require('passport-json').Strategy
const request = require('request-promise')


module.exports = function(passport) {

  passport.use(new JsonStrategy(async (username, password, done) => {

    done(null, {username: 'test', id : 1})
    // User Validation 
    // Validate if user valid for example, check to Data Base
    // User.findOne({username: username}, (err, user) => {
    //   if (user) {
    //    user.confirPassword(password, (err, confirm) => {
    //      if(confirm) return done(null, user)
    //      else return done(err, null)
    //  
    //    })
    //   }else
    //      return done(err, null)
    // })
  }))

  passport.serializeUser((user, done) => {
    // Serializing User, here save user data for then get again user for example idUser
    // 
    //done(null, user.idUser);
  
  })

  passport.deserializeUser(async (id, done) => {
    // Deserializing user. Here take id serialize and look for user again 
    // User.findById(id, (err, user) => {
    // if (err) return done(err, null)
    // return done(null, user)
    // })
    return done (null, {username: 'Test', id : 1})
  })

  return passport.initialize()

}