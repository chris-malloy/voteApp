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
                title: 'VotIT',
                users: results
            });
        }
    })
});

module.exports = router;