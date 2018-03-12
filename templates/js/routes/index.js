var express = require('express');
var router = express.Router();
/* It is not necessary to have authorization */


/* GET METHODS */
router.get('/', (req, res, next) => {
  res.send('Welcome to Express')
})



/* POST METHODS */
router.post('/status', function(req, res, next) {
  res.json({ seccess: true, status: 'ok' });
})

module.exports = router
