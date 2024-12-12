const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const Institute = require('../models/Institute'); // Adjust the path as needed
const Teacher = require('../models/teacher_model.js'); // Include teacher model

const JWT_SECRET = process.env.JWT_SECRET;

// Ensure JWT_SECRET is set
if (!JWT_SECRET) {
    console.error('Error: JWT_SECRET is not set in the environment variables.');
    process.exit(1);
}

// Utility function to verify the JWT token
const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
        });
    });
};

// Middleware to authenticate and attach decoded user data
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized: No authorization header provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const decoded = await verifyToken(token);
        req.user = decoded; // Attach decoded user data to the request object
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        }
        res.status(403).json({ message: 'Forbidden: Invalid token', error: error.message });
    }
};

// Middleware to verify if the token belongs to an authorized user and attach details
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ message: 'Access denied: No authorization header provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Access denied: No token provided' });
        }

        const decoded = await verifyToken(token);

        // Verify the role and find the appropriate user
        if (decoded.role === 'institute') {
            const institute = await Institute.findById(decoded.id);
            if (!institute) {
                return res.status(401).json({ message: 'Access denied: Invalid token' });
            }
            req.user = { userId: institute._id, role: decoded.role };
        } else if (['main-admin', 'sub-admin'].includes(decoded.role)) {
            const admin = await Admin.findById(decoded.userId);
            if (!admin) {
                return res.status(401).json({ message: 'Access denied: Invalid token' });
            }
            req.user = { userId: admin._id, role: decoded.role };
        } else if (decoded.role === 'teacher') {
            const teacher = await Teacher.findById(decoded.id);
            if (!teacher) {
                return res.status(401).json({ message: 'Access denied: Invalid token' });
            }
            req.user = { userId: teacher._id, role: decoded.role };
        } else {
            return res.status(403).json({ message: 'Forbidden: Invalid role' });
        }

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};



// Middleware to authenticate and check user role
const authenticateRole = (roles) => async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized: No authorization header provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const decoded = await verifyToken(token);
        console.log('Decoded token data:', decoded);

        if (!roles.includes(decoded.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        req.user = decoded; // Attach decoded user data to the request object
        next();
    } catch (error) {
        console.error('Role authentication error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        }
        res.status(403).json({ message: 'Forbidden: Invalid token', error: error.message });
    }
};



module.exports = {
    authenticate,
    authenticateToken,
    authenticateRole,
};
