const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Notification } = require('../models');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_placeholder';

exports.register = async (req, res) => {
    // Admin only access is enforced by route middleware
    const { username, password, role } = req.body;

    try {
        let user = await User.findOne({ where: { username } });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        user = await User.create({
            username,
            password_hash,
            role: (username === 'admin') ? 'SuperAdmin' : (role || 'Student'),
            permissions: req.body.permissions || {}
        });

        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (err) {
        console.error(err);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ msg: 'Username or Email already exists' });
        }
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ msg: err.errors.map(e => e.message).join(', ') });
        }
        res.status(500).send('Server Error: ' + err.message);
    }
};

const { Op } = require('sequelize');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check for user by username OR email
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { username: username },
                    { email: username }
                ]
            }
        });

        if (!user) {
            console.log(`[LOGIN DEBUG] User not found: ${username}`);
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        console.log(`[LOGIN DEBUG] User found: ${user.username}, Role: ${user.role}`);
        console.log(`[LOGIN DEBUG] Stored Hash: ${user.password_hash}`);

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`[LOGIN DEBUG] Password match result: ${isMatch}`);

        if (!isMatch) {
            console.log(`[LOGIN DEBUG] Password comparison failed for ${username}`);
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Update Last Login
        user.last_login = new Date();
        await user.save();

        // Trigger Notification for specific roles
        const monitorRoles = ['Student', 'Researcher', 'SuperAdmin'];
        if (monitorRoles.includes(user.role)) {
            try {
                const time = new Date().toLocaleString();
                await Notification.create({
                    type: 'LOGIN',
                    message: `New Login: ${user.username} has accessed the system at ${time}.`
                });
            } catch (notifyErr) {
                console.error("Failed to create login notification", notifyErr.message);
            }
        }

        const payload = {
            id: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '12h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, username: user.username, role: user.role, permissions: user.permissions } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user && user.username === 'admin') {
            return res.status(403).json({ message: 'Immutable: Main Admin cannot be deleted' });
        }

        await User.destroy({ where: { id: req.params.id } });
        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateUserPermissions = async (req, res) => {
    try {
        const { role, permissions } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.username === 'admin') {
            if (role) user.role = 'SuperAdmin';
        } else {
            if (role) user.role = role;
        }

        if (permissions) user.permissions = permissions;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error("Update User Error:", err.message);
        res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
};
