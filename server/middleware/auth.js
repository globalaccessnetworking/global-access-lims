const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_placeholder');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const authorize = (roles = [], module = null, requiredLevel = 'read') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // 1. Immutable 'admin' SuperAdmin protection
        if (req.user.username === 'admin' || req.user.role === 'SuperAdmin') {
            return next();
        }

        // 2. Role-based check
        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient rights' });
        }

        // 3. Module/Permission-based check
        if (module && req.user.permissions) {
            const userPermValue = req.user.permissions[module] || 'none';

            if (requiredLevel === 'write' && userPermValue !== 'write') {
                return res.status(403).json({ message: `Forbidden: Write access required for ${module}` });
            }
            if (requiredLevel === 'read' && userPermValue === 'none') {
                return res.status(403).json({ message: `Forbidden: Read access required for ${module}` });
            }
        }

        next();
    };
};

module.exports = { auth, authorize };
