var express = require('express');
var router = express.Router();

/* GET search page. */
router.get('/', (req, res, next) => {
  if (!req.query.q) {
    return res.json({
      success: false,
      error: 'No query',
    });
  }

  const search = require('../modules/search.js');
  search(req.query.q, (err, result) => {
    res.json(err || result);
  });
});

module.exports = router;
