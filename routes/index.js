const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const config = require('../config/config')
const connection = mysql.createConnection(config.db);


/* GET home page. */
router.get('/', function(req, res, next) {
    var selectQuery = "SELECT * FROM users;";
    connection.query(selectQuery, (error, results) => {
        if (error) {
            throw error;
        } else {
            res.render('index', {
                title: 'Rock or Not',
                users: results
            });
        }
    })
});

/* REGISTER */
router.get("/register", (req, res, next) => {
    res.render('register', {});
})

router.post("/registerProcess", (req, res, next) => {
    res.render('register', {});
})

/* Login */
router.get("/login", (req, res, next) => {
    res.render("login", {});
})
router.post("/loginProcess", (req, res, next) => {
    res.render("login", {});
})

module.exports = router;