const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

// Middleware to authenticate the user
const authenticate = (req, res, next) => {
    try {

        // Get the token from the Authorization header (Expected format: "Bearer <token>")
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized: No authorization header provided' });
        }

        const token = authHeader.split(' ')[1]; // Split "Bearer <token>"
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        
        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ message: 'Unauthorized: Token expired' });
                }
                return res.status(403).json({ message: 'Forbidden: Invalid token' });
            }


            // Attach decoded user data to the request object
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

const authenticateToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Access denied: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Assuming you have a JWT secret in env
        const admin = await Admin.findById(decoded.userId); // Assuming the token contains a `userId`

        if (!admin) {
            return res.status(401).json({ message: 'Access denied: Invalid token' });
        }

        req.user = { userId: admin._id }; // Attach the admin's ID to `req.user`
        next(); // Move to the next middleware
    } catch (err) {
        res.status(401).json({ message: 'Invalid token', error: err.message });
    }
};




module.exports = { authenticate, authenticateToken };
