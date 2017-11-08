var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    if (req.session.name === undefined) {
        res.redirect('/login');
    } else {
        var name = req.session.name;
        var email = req.session.email;
        res.render('users', {
            name: name,
            email: email
        })
    }
});

module.exports = router;