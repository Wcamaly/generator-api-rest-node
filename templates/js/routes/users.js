var express = require('express');
var router = express.Router();
/* It is necessary to have authorization */



/* POST users listing. */
router.post('/getUsers', (req, res, next) => {
  res.send('respond with a resource');
});

module.exports = router;
