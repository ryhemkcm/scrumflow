const db = require('../config/db'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    db.query('SELECT * FROM Employee WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: "Internal server error", details: err.message });
        }

        if (results.length === 0) {
            console.log('No employee found with email:', email);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const employee = results[0];
        console.log('Found employee:', employee.id);

        bcrypt.compare(password, employee.password, (err, isMatch) => {
            if (err) {
                console.error('Bcrypt error:', err);
                return res.status(500).json({ error: "Internal server error", details: err.message });
            }

            if (!isMatch) {
                console.log('Password mismatch for employee:', employee.id);
                return res.status(401).json({ message: "Invalid credentials" });
            }

            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET is missing!');
                return res.status(500).json({ error: "Server configuration error" });
            }

            const token = jwt.sign(
                { id: employee.id, role: employee.role.toLowerCase()},
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            console.log('Login successful for employee:', employee.id);
            res.json({
                token,
                employee: {
                    id: employee.id,
                    name: employee.name,
                    email: employee.email,
                    role: employee.role
                }
            });
            console.log("Employee role from DB:", employee.role);
            console.log("Employee ID from DB:", employee.id);
        });
    });
};
