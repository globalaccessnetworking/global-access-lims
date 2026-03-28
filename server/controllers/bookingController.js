const { sequelize } = require('../models');

/**
 * Get all bookings for equipment
 */
exports.getBookings = async (req, res) => {
    try {
        const { equipment_id, start_date, end_date } = req.query;

        let query = `
            SELECT b.*, u.username, e.equipment_name
            FROM equipment_bookings b
            LEFT JOIN "Users" u ON b.user_id = u.id
            LEFT JOIN ext_equipment_logs e ON b.equipment_id = e.id
            WHERE 1=1
        `;
        const bindings = [];

        if (equipment_id) {
            bindings.push(parseInt(equipment_id));
            query += ` AND b.equipment_id = $${bindings.length}`;
        }

        if (start_date) {
            bindings.push(start_date);
            query += ` AND b.end_time >= $${bindings.length}`;
        }

        if (end_date) {
            bindings.push(end_date);
            query += ` AND b.start_time <= $${bindings.length}`;
        }

        query += ` ORDER BY b.start_time ASC`;

        const [bookings] = await sequelize.query(query, { bind: bindings });
        res.json({ bookings });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create a new booking with conflict detection
 */
exports.createBooking = async (req, res) => {
    try {
        const { equipment_id, start_time, end_time, purpose } = req.body;
        const user_id = req.user?.id;

        if (!equipment_id || !start_time || !end_time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for conflicts
        const [conflicts] = await sequelize.query(
            `SELECT id FROM equipment_bookings 
             WHERE equipment_id = $1 
             AND status = 'confirmed'
             AND (
                 (start_time <= $2 AND end_time > $2) OR
                 (start_time < $3 AND end_time >= $3) OR
                 (start_time >= $2 AND end_time <= $3)
             )`,
            { bind: [parseInt(equipment_id), start_time, end_time] }
        );

        if (conflicts.length > 0) {
            return res.status(409).json({ error: 'Time slot already booked' });
        }

        // Create booking
        const [result] = await sequelize.query(
            `INSERT INTO equipment_bookings (equipment_id, user_id, start_time, end_time, purpose, status)
             VALUES ($1, $2, $3, $4, $5, 'confirmed') RETURNING *`,
            { bind: [parseInt(equipment_id), user_id, start_time, end_time, purpose || ''] }
        );

        res.json({ success: true, booking: result[0] });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Cancel a booking
 */
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;

        // Check ownership
        const [bookings] = await sequelize.query(
            `SELECT user_id FROM equipment_bookings WHERE id = $1`,
            { bind: [parseInt(id)] }
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Allow cancellation by owner or admin
        const [users] = await sequelize.query(
            `SELECT role FROM "Users" WHERE id = $1`,
            { bind: [user_id] }
        );

        const isAdmin = users.length > 0 && users[0].role === 'SuperAdmin';
        const isOwner = bookings[0].user_id === user_id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Not authorized to cancel this booking' });
        }

        await sequelize.query(
            `UPDATE equipment_bookings SET status = 'cancelled' WHERE id = $1`,
            { bind: [parseInt(id)] }
        );

        res.json({ success: true, message: 'Booking cancelled' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get available time slots for equipment
 */
exports.getAvailableSlots = async (req, res) => {
    try {
        const { equipment_id, date } = req.query;

        if (!equipment_id || !date) {
            return res.status(400).json({ error: 'equipment_id and date required' });
        }

        const startOfDay = `${date} 00:00:00`;
        const endOfDay = `${date} 23:59:59`;

        const [bookings] = await sequelize.query(
            `SELECT start_time, end_time FROM equipment_bookings
             WHERE equipment_id = $1
             AND status = 'confirmed'
             AND start_time >= $2
             AND end_time <= $3
             ORDER BY start_time ASC`,
            { bind: [parseInt(equipment_id), startOfDay, endOfDay] }
        );

        res.json({ bookings, date });
    } catch (error) {
        console.error('Get available slots error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = exports;
