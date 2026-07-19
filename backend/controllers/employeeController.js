const db = require('../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;



const multer = require('multer');
const path = require('path');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'employees'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'employee-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configuration de multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif)'));
    }
}).single('image'); // 'image' doit correspondre au nom du champ dans le formulaire React/Postman


exports.createEmployee = (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError || err) {
            console.error('Upload error:', err.message);
            return res.status(400).json({ error: err.message });
        }

        const { name, email, role, specialty, team_id } = req.body;
        const imageUrl = req.file ? req.file.filename : null;

        if (!name || !email || !role) {
            return res.status(400).json({ error: 'Name, email and role are required.' });
        }

        const teamIdNum = team_id ? parseInt(team_id, 10) : null;

        const query = `
            INSERT INTO Employee (name, email, role, specialty, team_id, image_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [name, email, role, specialty || null, teamIdNum, imageUrl];

        db.query(query, params, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Email already exists' });
                }
                console.error('Database error in createEmployee:', err);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'Employee created successfully', id: result.insertId });
        });
    });
};


exports.updateEmployee = (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError || err) {
            console.error('Upload error:', err.message);
            return res.status(400).json({ error: err.message });
        }

        const employeeId = parseInt(req.params.id, 10);
        const { name, email, role, specialty, team_id } = req.body;
        const imageUrl = req.file ? req.file.filename : null;

        if (!name || !email || !role) {
            return res.status(400).json({ error: 'Name, email and role are required.' });
        }

        const teamIdNum = team_id ? parseInt(team_id, 10) : null;

        const baseQuery = `
            UPDATE Employee
            SET name = ?, email = ?, role = ?, specialty = ?, team_id = ? ${imageUrl ? ', image_url = ?' : ''}
            WHERE id = ?
        `;

        const params = imageUrl
            ? [name, email, role, specialty || null, teamIdNum, imageUrl, employeeId]
            : [name, email, role, specialty || null, teamIdNum, employeeId];

        db.query(baseQuery, params, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Email already exists' });
                }
                console.error('Database error in updateEmployee:', err);
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Employee not found or no changes made' });
            }

            res.json({ message: 'Employee updated successfully', id: employeeId });
        });
    });
};


exports.getEmployeePassword = async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const query = 'SELECT password FROM Employee WHERE id = ?';
    
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json({ password: results[0].password });
    });
};

exports.getAllEmployees = (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/employees/`;

    const query = `
        SELECT 
            e.id,
            e.name,
            e.email,
            e.role,
            e.specialty,
            e.image_url,
            et.team_id,
            t.name AS team_name,
            CONCAT(?, ?, e.image_url) AS full_image_url
        FROM Employee e
        LEFT JOIN Employee_team et ON e.id = et.employee_id
        LEFT JOIN Team t ON et.team_id = t.id
    `;

    db.query(query, [req.protocol, '://' + req.get('host') + '/uploads/employees/'], (err, results) => {
        if (err) {
            console.error('Database error in getAllEmployees:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};

exports.getAllEmployeesWithTeams = (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/employees/`;

    // 1) On récupère toutes les équipes
    const query = `SELECT * FROM team`;

    db.query(query, (err, teams) => {
        if (err) {
        console.error('Database error fetching teams:', err);
        return res.status(500).json({ error: err.message });
        }

        const employeeTeamsMap = {};

        teams.forEach(team => {
        if (team.product_owner) {
            if (!employeeTeamsMap[team.product_owner]) employeeTeamsMap[team.product_owner] = [];
            employeeTeamsMap[team.product_owner].push({
            team_id: team.id,
            team_name: team.name,
            role: 'product_owner'
            });
        }

        if (team.scrum_master) {
            if (!employeeTeamsMap[team.scrum_master]) employeeTeamsMap[team.scrum_master] = [];
            employeeTeamsMap[team.scrum_master].push({
            team_id: team.id,
            team_name: team.name,
            role: 'scrum_master'
            });
        }

        if (team.developers) {
            const devIds = team.developers.split(',').map(id => parseInt(id.trim(), 10));
            devIds.forEach(devId => {
            if (!employeeTeamsMap[devId]) employeeTeamsMap[devId] = [];
            employeeTeamsMap[devId].push({
                team_id: team.id,
                team_name: team.name,
                role: 'developer'
            });
            });
        }
        });

        // 3) Récupération des employés avec image complète
        const employeesQuery = `
        SELECT 
            id, name, email, role, specialty, image_url
        FROM Employee
        `;

        db.query(employeesQuery, (err, employees) => {
        if (err) {
            console.error('Database error fetching employees:', err);
            return res.status(500).json({ error: err.message });
        }

        // Ajout des équipes et de full_image_url
        const employeesWithTeams = employees.map(emp => {
            return {
            ...emp,
            full_image_url: emp.image_url ? baseUrl + emp.image_url : null,
            teams: employeeTeamsMap[emp.id] || []
            };
        });

        res.json(employeesWithTeams);
        });
    });
};


exports.resetPassword = async (req, res) => {
    const { id } = req.params;
    const newPassword = Math.random().toString(36).slice(-8); // Génère un mot de passe temporaire
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.query(
        'UPDATE Employee SET password = ? WHERE id = ?',
        [hashedPassword, id],
        (err, result) => {
            if (err) {
                console.error('Erreur SQL lors de la réinitialisation du mot de passe :', err);
                return res.status(500).json({ message: "Erreur lors de la réinitialisation" });
            }
            res.status(200).json({ message: 'Mot de passe réinitialisé avec succès', newPassword });
        }
    );
};




exports.deleteEmployee = (req, res) => {
    const employeeId = req.params.id;
    const query = 'DELETE FROM Employee WHERE id = ?';

    db.query(query, [employeeId], (err) => {
        if (err) {
            console.error('Error deleting employee:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Employee deleted successfully' });
    });
};

exports.getTasksByEmployee = async (req, res) => {
    try {
        const employeeId = req.params.id;
        
        if (!employeeId || isNaN(employeeId)) {
            return res.status(400).json({ error: "ID employé invalide" });
        }

        const query = `
            SELECT t.*, 
                e.name as assigned_name,
                e.role as assigned_role,
                us.ref as user_story_ref
            FROM Task t
            LEFT JOIN employee e ON t.assigned_to = e.id
            LEFT JOIN UserStory us ON t.user_story_id = us.id
            WHERE t.assigned_to = ?
            ORDER BY 
                CASE t.priority
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                END,
                t.deadline ASC
        `;

        const [tasks] = await db.promise().query(query, [employeeId]);
        
        if (tasks.length === 0) {
            return res.status(404).json({ message: "Aucune tâche trouvée pour cet employé" });
        }

        res.json(tasks);
    } catch (err) {
        console.error('Erreur:', err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};