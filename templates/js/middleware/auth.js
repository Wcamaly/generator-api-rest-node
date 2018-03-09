'use strict'

module.exports = function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next()}
  let error = new Error('not authorized')
  next(error)
}