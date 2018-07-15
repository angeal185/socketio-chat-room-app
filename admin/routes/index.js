const express = require('express'),
router = express.Router(),
_ = require('lodash'),
config = require('../config');


router.get('/', function(req, res) {
  res.render('index', {
    title: 'chat',
    config:config
  });
});

module.exports = router;
