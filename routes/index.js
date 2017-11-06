const express = require('express');
const router = express.Router();
const mysql = require('mysql')
const config = require('../config/config')
const bcrypt = require('bcrypt-nodejs');

const connection = mysql.createConnection(config.db);
connection.connect((error) => {
    if (error) {
        throw error;
    }
})

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session.name != undefined) {
        console.log(`Welcome, ${req.session.name}`);
    }
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
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    // ensure user email does not exists
    const selectQuery = `SELECT * FROM users WHERE email = ?;`;
    connection.query(selectQuery, [email], (error, results) => {
        if (results.length != 0) {
            res.redirect('/register?msg=registered')
        } else {
            var hash = bcrypt.hashSync(password);
            insertQuery = `INSERT INTO users (name,email,password) VALUES (?,?,?);`;
            connection.query(insertQuery, [name, email, hash], (error) => {
                if (error) {
                    throw error;
                } else {
                    res.redirect('/registerSuccess?msg=registered');
                };
            });
        };
    });
})

router.get('/registerSuccess'), (req, res, next) => {
    res.render('registerSuccess');
}

/* Login */
router.get("/login", (req, res, next) => {
    res.render("login", {});
})
router.post("/loginProcess", (req, res, next) => {
    var email = req.body.email;
    var password = req.body.password;
    var selectQuery = `SELECT * FROM users WHERE email = ?;`;
    connection.query(selectQuery, [email], (error, results) => {
        if (error) {
            throw error;
        } else {
            if (results.length == 0) {
                res.redirect('/login?msg=userNotFound');
            } else {
                // password = user pass, results[0].password = hash saved to database
                var passwordsMatch = bcrypt.compareSync(password, results[0].password);
                if (passwordsMatch) {
                    req.session.name = results[0].name;
                    req.session.id = results[0].id;
                    req.session.email = results[0].email;
                    res.redirect('/');
                } else {
                    res.redirect('/login?msg=badPass');
                }
            };
        };
    });
});

/* Standings */
router.get("/standings", (req, res, next) => {
    res.render("standings", {});
})

module.exports = router;