const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConn = require('./database');
const { body, validationResult, Result } = require('express-validator');
const { promise } = require('bcrypt/promises');
const { isAdmin, isUser } = require('./router/middleware')
// const { updateTimeslotStatus } = require('./middleware'); // Import isAdmin middleware

const app = express();

app.use(express.urlencoded({ extended: false }));
// app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//เขาพาทำ
app.use(cookieSession({
    name: "session",
    keys: ["key1", "key2"],
    maxAge: 3600 * 1000 //hr
}));

//declaring custom midderware
const ifNotLoggedIn = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.render('login-register');
    }
    next();
}

const ifLoggedIn = (req, res, next) => {
    if (req.session.isLoggedIn) {
        if (req.session.userRole === '1') {
            return res.redirect('/admin-home'); // ถ้าเป็น admin ให้ redirect ไปยังหน้า admin-home
        } else if (req.session.userRole === '2') {
            return res.redirect('/user-home'); // ถ้าเป็น user ให้ redirect ไปยังหน้า user-home
        }
    }
    next();
}

// ลองเอง
// const ifLoggedIn = (req, res, next) => {
//     if (req.session.isLoggedIn) {
//         if (req.session.userRole === '1') {
//             return res.redirect('/admin-home'); // ถ้าเป็น admin ให้ redirect ไปยังหน้า admin-home
//         } else if (req.session.userRole === '2') {
//             return res.redirect('/user-home'); // ถ้าเป็น user ให้ redirect ไปยังหน้า user-home
//         }
//     }
//     next();
// }

//ลองย้าย
// const isAdmin = (req, res, next) => {
//     if (req.session.isLoggedIn && req.session.userRole === '1') {
//         next(); // Allow access to the next middleware or route handler
//     } else {
//         res.status(403).send('Access Forbidden'); // Return 403 Forbidden if not an admin
//     }
// };

// const isUser = (req, res, next) => {
//     if (req.session.isLoggedIn && req.session.userRole === '2') {
//         next(); // Allow access to the next middleware or route handler
//     } else {
//         res.status(403).send('Access Forbidden'); // Return 403 Forbidden if not a user
//     }
// };

// Admin home page
app.get('/admin-home', isAdmin,async(req, res) => {
    // dbConn.execute("SELECT name FROM users WHERE id = ?", [req.session.userID])
    //     .then(([rows]) => {
    //         res.render('admin-home', { name: rows[0].name });
    //     })
    //     .catch(err => {
    //         console.error("Error fetching user's name:", err);
    //         res.status(500).send('Internal Server Error');
    //     });
    try {
        const query = `
        SELECT AvailableTimeslots.*, Rooms.*, AvailableTimeslots.status AS statustime,
               DATE_FORMAT(AvailableTimeslots.date, '%d-%m-%Y') AS formattedDate
        FROM AvailableTimeslots
        JOIN Rooms ON AvailableTimeslots.roomID = Rooms.roomid 
        WHERE AvailableTimeslots.status = "1" OR AvailableTimeslots.status = "2"        
        `;
        const [availableTimeslots] = await dbConn.execute(query);

        res.render('admin-home', { availableTimeslots });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// app.get('/adminroom', isAdmin, (req, res) => {
//     res.render('adminroom');
// });



// User home page
app.get('/user-home', isUser, (req, res) => {
    dbConn.execute("SELECT name FROM users WHERE id = ?", [req.session.userID])
        .then(([rows]) => {
            res.render('user-home', { name: rows[0].name });
        })
        .catch(err => {
            console.error("Error fetching user's name:", err);
            res.status(500).send('Internal Server Error');
        });
});


// root page
//แก้ user admin
app.get('/', ifNotLoggedIn, (req, res, next) => {
    dbConn.execute("select name from users where id =?", [req.session.userID])
        .then(([rows]) => {
            res.render('home', {
                name: rows[0].name
            })
        });
})

app.post('/register', ifLoggedIn, [
    body('user_email', "inva email").isEmail().custom((value) => {
        return dbConn.execute('select email from users where email=?', [value])
            .then(([rows]) => {
                if (rows.length > 0) {
                    return Promise.reject('this email already in use');
                }
                return true;
            })
    }),
    body('user_name', 'user name empty').trim().not().isEmpty(),
    body('user_pass', 'the pass must be minimum length 6 charecters.').trim().isLength({ min: 6 }),
],//จบตรวจสอบ
    (req, res, next) => {
        const validation_Result = validationResult(req);
        const { user_name, user_pass, user_email } = req.body;

        if (validation_Result.isEmpty()) {
            bcrypt.hash(user_pass, 12).then((hash_pass) => {
                dbConn.execute('insert into users (name, email, password, role) values(?,?,?,?)', [user_name, user_email, hash_pass, '2'])
                    .then(resultn => {
                        res.send(`add suscess <a href="/">login</a>`);
                    }).catch(err => {
                        if (err) throw err;
                    })
            }).catch(err => {
                if (err) throw err;
            })
        } else {
            let allerror = validation_Result.errors.map((error) => {
                return error.msg;
            })

            res.render('login-register', {
                register_error: allerror,
                old_data: req.body
            })
        }
    }
)
// login
// app.post('/', ifLoggedIn, [
//     body('user_email').custom((value) => {
//         return dbConn.execute("select email from users where email = ?", [value])
//         .then(([rows]) => {
//             if (rows.length == 1) {
//                 return true;
//             }
//             return Promise.reject('Invalid email')
//         });
//     }),
//     body('user_pass', 'pass is empty').trim().not().isEmpty(),
// ], (req, res) => {
//     const validation_Result = validationResult(req);
//     const { user_email, user_pass, user_role } = req.body;
//     if (validation_Result.isEmpty()) { 
//         dbConn.execute('select * from users where email = ?', [user_email])
//             .then(([rows]) => {
//                 bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
//                     if (compare_result === true) {
//                         req.session.isLoggedIn = true;
//                         req.session.userID = rows[0].id;
//                         res.redirect('/');
//                     } else {
//                         res.render("login-register", {
//                             login_errors: ['invalid pass']
//                         })
//                     }
//                 }).catch(err => {
//                     if (err) throw err;
//                 })
//             }).catch(err => {
//                 if (err) throw err;
//             })

//     } else {
//         let allerror = validation_Result.errors.map((error) => {
//             return error.msg;
//         })
//         res.render('login-register', {
//             login_errors: allerror
//         })
//     }
// })

// ลองเอง ได้แล้ว
// login
// app.post('/login', ifLoggedIn, [
//     body('user_email').custom((value) => {
//         return dbConn.execute("select email from users where email = ?", [value])
//         .then(([rows]) => {
//             if (rows.length == 1) {
//                 return true;
//             }
//             return Promise.reject('Invalid email')
//         });
//     }),
//     body('user_pass', 'pass is empty').trim().not().isEmpty(),
// ], (req, res) => {
//     const validation_Result = validationResult(req);
//     const { user_email, user_pass } = req.body;

//     if (validation_Result.isEmpty()) { 
//         dbConn.execute('select * from users where email = ?', [user_email])
//             .then(([rows]) => {
//                 bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
//                     if (compare_result === true) {
//                         req.session.isLoggedIn = true;
//                         req.session.userID = rows[0].id;
//                         req.session.userRole = rows[0].role; // Set userRole in session

//                         // Redirect based on user role
//                         if (req.session.userRole === '1') {
//                             res.redirect('/admin-home');
//                         } else if (req.session.userRole === '2') {
//                             res.redirect('/user-home');
//                         }
//                     } else {
//                         res.render("login-register", {
//                             login_errors: ['Invalid password']
//                         })
//                     }
//                 }).catch(err => {
//                     if (err) throw err;
//                 })
//             }).catch(err => {
//                 if (err) throw err;
//             })
//     } else {
//         let allerror = validation_Result.errors.map((error) => {
//             return error.msg;
//         })
//         res.render('login-register', {
//             login_errors: allerror
//         })
//     }
// })

//แบบมี json
// login

app.post('/login', ifLoggedIn, [
    body('user_email').custom((value) => {
        return dbConn.execute("select email from users where email = ?", [value])
            .then(([rows]) => {
                if (rows.length == 1) {
                    return true;
                }
                return Promise.reject('Invalid email')
            });
    }),
    body('user_pass', 'pass is empty').trim().not().isEmpty(),
], (req, res) => {
    const validation_Result = validationResult(req);
    const { user_email, user_pass } = req.body;

    if (validation_Result.isEmpty()) {
        dbConn.execute('select * from users where email = ?', [user_email])
            .then(([rows]) => {
                bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
                    if (compare_result === true) {
                        req.session.isLoggedIn = true;
                        req.session.userID = rows[0].id;
                        req.session.userRole = rows[0].role; // Set userRole in session

                        // Redirect based on user role
                        if (req.session.userRole === '1') {
                            res.redirect('/admin-home');
                        } else if (req.session.userRole === '2') {
                            res.redirect('/user-home');
                        } else {
                            // Send "Successful login" message for API JSON testing
                            res.json({ message: "Successful login" });
                        }
                    } else {
                        res.render("login-register", {
                            login_errors: ['Invalid password']
                        })
                    }
                }).catch(err => {
                    if (err) throw err;
                })
            }).catch(err => {
                if (err) throw err;
            })
    } else {
        let allerror = validation_Result.errors.map((error) => {
            return error.msg;
        })
        res.render('login-register', {
            login_errors: allerror
        })
    }
})

// logout
app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
})




const { updateTimeslotStatus, router: adminapiRouter } = require('./router/adminapi');
const { updateTimeslotStatuslate, router: userapiRouter } = require('./router/userapi');

// const   userapiRouter  = require('./router/userapi')


// const   adminapiRoute  = require('./router/adminapi')
// const loginRouter = require('./router/login')


// app.use('/login', loginRouter)
app.use('/admin', adminapiRouter)
app.use('/user', userapiRouter)


updateTimeslotStatus();

updateTimeslotStatuslate();

// เรียกใช้งานฟังก์ชัน updateTimeslotStatus เมื่อเริ่มต้น server
// app.listen(3030, () => console.log("server running ...")); 
app.listen(3030, () => {
    console.log("Server is running on port 3030");
});
