const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const config = require('../config/config');
const bcrypt = require('bcrypt-nodejs');
const fs = require('fs');
const multer = require('multer');
const uploadDir = multer({
    dest: 'public/images'
});
const nameOfFileField = uploadDir.single('imageToUpload');

const connection = mysql.createConnection(config.db);
connection.connect((error) => {
    if (error) {
        throw error;
    }
})

/* GET home page. */
router.get('/', function(req, res, next) {
        if (req.session.name === undefined) {
            res.redirect('/login?msg=mustlogin')
            return;
        }
        //we want to select all the image that the user has not voted on
        var selectQuery = `
        SELECT * FROM images WHERE id NOT IN(
            SELECT imgID FROM votes WHERE userID = ?
        );
    `
            // var selectQuery = 'SELECT * FROM images;';
        connection.query(selectQuery, [req.session.uid], (error, results, field) => {
            var rand = Math.floor(Math.random() * results.length);
            if (results.length == 0) {
                res.redirect('/standings')
            } else {
                res.render('index', {
                    results: results[rand],
                    name: req.session.name,
                    loggedIn: true
                });
            }
        })

    })
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
            var insertQuery = `INSERT INTO users (name,email,password) VALUES (?,?,?);`;
            connection.query(insertQuery, [name, email, hash], (error) => {
                if (error) {
                    throw error;
                } else {
                    res.redirect('/?msg=welcome');
                };
            });
        };
    });
})

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

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
})

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
router.get('/standings', (req, res, next) => {
    const standingsQuery = `
        SELECT bands.title,bands.imageUrl,votes.imageID, SUM(IF(voteDirection='up',1,0)) as upVotes, SUM(IF(voteDirection='down',1,0)) as downVotes, SUM(IF(voteDirection='up',1,-1)) as total FROM votes
            INNER JOIN bands on votes.imageID = bands.id
            GROUP BY imageID;`
    connection.query(standingsQuery, (error, results) => {
        results.map((band, i) => {
            if (band.upVotes / (band.upVotes + band.downVotes) > .8) {
                results[i].class = "top-rated"
            } else if (band.upVotes / (band.upVotes + band.downVotes) <= .5) {
                results[i].cls = "worst-rated";
            } else {
                results[i].cls = "middle";
            }
        });
        if (error) {
            throw error;
        } else {
            res.render('standings', {
                standingsResults: results
            });
        }
    })
})

router.post('/uploadBand', (req, res) => {
    res.render('upload');
})
router.post('/formSubmit', nameOfFileField, (req, res) => {
    var tmpPath = req.file.path;
    var targetPath = `public/images/${req.file.originalname}`;
    fs.readFile(tmpPath, (error, fileContents) => {
        if (error) {
            throw error;
        }
        fs.writeFile(targetPath, fileContents, (error) => {
            if (error) {
                throw error;
            }
            var insertQuery = `INSERT INTO bands (imageUrl, title) 
                                    VALUES
                                    (?,?);`
            connection.query(insertQuery, [req.file.originalname, req.body.bandName], (error) => {
                if (dbError) {
                    throw dbError;
                }
                res.redirect('/')
            })
        })
    })
})
router.get('', function(req, res, next) {
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

router.post('/userProcess', (req, res, next) => {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    if (email = "") {
        res.redirect('/user?msg=emptyEmail');
        return;
    }
    if ((password == "") || (name == "")) {
        var updateQuery = `UPDATE users SET 
            name = ?, 
            email = ? 
            WHERE id = ?;`;
        var queryParams = [name, email, req.session.uid];
    } else {
        var updateQuery = `UPDATE users SET 
            name = ?, 
            email = ?,
            password = ?
            WHERE id = ?;`;
        var hash = bcrypt.hashSync(password);
        var queryParams = [name, email, hash, req.session.uid];
    }
    connection.query(updateQuery, queryParams, (error, results) => {
        if (error) {
            throw error;
        }
        res.redirect('/')
    })
})

module.exports = router;

// TODO - 
// fix login bool
// fix login