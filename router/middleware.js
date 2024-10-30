const isAdmin = (req, res, next) => {
    if (req.session.isLoggedIn && req.session.userRole === '1') {
        next(); // Allow access to the next middleware or route handler
    } else {
        res.status(403).send('Access Forbidden'); // Return 403 Forbidden if not an admin
    }
};

const isUser = (req, res, next) => {
    if (req.session.isLoggedIn && req.session.userRole === '2') {
        next(); // Allow access to the next middleware or route handler
    } else {
        res.status(403).send('Access Forbidden'); // Return 403 Forbidden if not a user
    }
};


module.exports = {isAdmin,isUser};
 