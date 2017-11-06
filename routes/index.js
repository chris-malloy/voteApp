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
    if (req.session.name == undefined) {
        res.redirect('/login?msg=mustLogin');
        return;
    }
    const getBands = new Promise((resolve, reject) => {
        var selectQuery = "SELECT * FROM bands;";
        connection.query(selectQuery, (error, results, fields) => {
            if (error) {
                reject(error)
            } else {
                var rand = Math.floor(Math.random() * results.length);
                resolve(results[rand]);
            }
        });
    });
    getBands.then((bandObj) => {
        console.log(bandObj);
        res.render('index', {
            title: 'Rock or Not',
            name: req.session.name,
            band: bandObj
        });
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
                    var row = results[0];
                    req.session.name = row.name;
                    req.session.uid = row.id;
                    req.session.email = row.email;
                    res.redirect('/');
                } else {
                    res.redirect('/login?msg=badPass');
                }
            };
        };
    });
});

router.get('/vote/:direction/:bandId', (req, res, next) => {
    var bandId = req.params.bandId;
    var direction = req.params.direction;
    var insertVoteQuery = `INSERT INTO votes (imageID,voteDirection,userID) VALUES (?,?,?);`;
    connection.query(insertVoteQuery, [bandId, direction, req.session.uid], (error, results) => {
        if (error) {
            throw error;
        } else {
            res.redirect('/');
        }
    })

})


/* Standings */
router.get("/standings", (req, res, next) => {
    res.render("standings", {});
})

module.exports = router;