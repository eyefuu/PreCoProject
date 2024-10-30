const mysql = require("mysql2")
const dbConn = mysql.createPool({
    host:"localhost",
    user:"root",
    password:"",
    database:"meet"
}).promise()

module.exports = dbConn;
