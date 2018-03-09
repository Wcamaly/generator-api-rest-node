var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Welcome to Express')
})
router.post('/status', function(req, res, next) {
  res.json({ seccess: true, status: 'ok' });
})

module.exports = router
