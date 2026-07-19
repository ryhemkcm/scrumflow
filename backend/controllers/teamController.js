const db = require('../config/db');

exports.getAllTeams = (req, res) => {
    const query = 'SELECT * FROM Team';
    console.log('Executing query:', query); 

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err); 
            return res.status(500).json({ error: err.message });  
        }
        res.json(results);
    });
};



exports.getAllTeamsForSM = async (req, res) => {
    const employeeId = req.params.employeeId;

    if (!employeeId || employeeId === 'null') {
        return res.status(400).json({
            error: "ID employé invalide",
            received: employeeId
        });
    }

    try {
        const query = `
            SELECT
                t.id,
                t.name,
                t.product_owner, -- You might want to select this if needed on frontend
                t.scrum_master,  -- You might want to select this if needed on frontend
                t.developers     -- You might want to select this if needed on frontend
            FROM Team t
            WHERE t.scrum_master = ?;
        `;
        // Removed 't.description' as it's not in your schema.
        // Added other columns from your `team` table if you might need them.
        // You can remove product_owner, scrum_master, developers from SELECT if you only need id and name.

        const [results] = await db.promise().query(query, [employeeId]);
        res.status(200).json(results);
    } catch (err) {
        console.error('Erreur dans getTeamsForSM:', err);
        res.status(500).json({
            error: 'Erreur lors de la récupération des équipes',
            details: err.message,
            sql: err.sql // This will show the exact SQL query that failed
        });
    }
};



exports.createTeam = (req, res) => {
    console.log('Payload received:', req.body);

    const { name, product_owner, scrum_master, developers, projectId } = req.body; // Destructure projectId

    if (!name || !product_owner || !scrum_master || !developers) {
        return res.status(400).json({ error: 'All team fields are required' });
    }

    const developersString = Array.isArray(developers) 
        ? developers.join(',') 
        : developers;

    // Start a transaction for atomicity (recommended for multi-step operations)
    db.beginTransaction(err => {
        if (err) {
            console.error('Failed to begin transaction:', err);
            return res.status(500).json({ error: 'Failed to begin transaction' });
        }

        // 1. Insert into Team table
        db.query(
            'INSERT INTO Team (name, product_owner, scrum_master, developers) VALUES (?, ?, ?, ?)',
            [
                name,
                parseInt(product_owner),
                parseInt(scrum_master),
                developersString
            ],
            (err, teamResult) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Database error creating team:', err);
                        res.status(500).json({ error: err.message });
                    });
                }

                const newTeamId = teamResult.insertId;

                // 2. If projectId is provided, insert into Project_Team table
                if (projectId) {
                    const parsedProjectId = parseInt(projectId);
                    if (isNaN(parsedProjectId)) {
                        return db.rollback(() => {
                            res.status(400).json({ error: 'Invalid projectId provided' });
                        });
                    }

                    db.query(
                        'INSERT INTO Project_Team (project_id, team_id) VALUES (?, ?)',
                        [parsedProjectId, newTeamId],
                        (err, projectTeamResult) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Database error associating project with team:', err);
                                    res.status(500).json({ error: err.message });
                                });
                            }

                            // Commit the transaction if both inserts are successful
                            db.commit(err => {
                                if (err) {
                                    return db.rollback(() => {
                                        console.error('Failed to commit transaction:', err);
                                        res.status(500).json({ error: 'Failed to commit transaction' });
                                    });
                                }
                                res.status(201).json({ 
                                    message: 'Team created and associated with project successfully', 
                                    teamId: newTeamId,
                                    projectId: parsedProjectId
                                });
                            });
                        }
                    );
                } else {
                    // No projectId provided, just commit team creation
                    db.commit(err => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Failed to commit transaction (no project association):', err);
                                res.status(500).json({ error: 'Failed to commit transaction' });
                            });
                        }
                        res.status(201).json({ 
                            message: 'Team created successfully (no project associated)', 
                            teamId: newTeamId 
                        });
                    });
                }
            }
        );
    });
};

exports.updateTeam = (req, res) => {
    const { name, product_owner, scrum_master, developers } = req.body;


    if (!name || !product_owner || !scrum_master || !developers) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const devsString = Array.isArray(developers) 
        ? developers.join(',') 
        : developers;

    const query = `
        UPDATE Team SET 
            name = ?,
            product_owner = ?,
            scrum_master = ?,
            developers = ?
        WHERE id = ?
    `;
    
    db.query(query, 
        [
            name,
            parseInt(product_owner),
            parseInt(scrum_master),
            devsString,
            parseInt(req.params.id)
        ], 
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Team successfully updated' });
        }
    );
};

exports.deleteTeam = (req, res) => {
    const teamId = req.params.id;
    
    if (!teamId || isNaN(teamId)) {
        return res.status(400).json({ 
            error: 'Invalid team ID',
            receivedId: teamId
        });
    }

    // 1. D'abord libérer les projets associés (mettre team_id à NULL)
    db.query(
        "UPDATE projects SET team_id = NULL WHERE team_id = ?", 
        [teamId], 
        (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ 
                    error: 'Failed to unassign projects',
                    details: updateErr.message
                });
            }
            
            // 2. Puis supprimer l'équipe
            db.query(
                "DELETE FROM Team WHERE id = ?", 
                [teamId], 
                (deleteErr, result) => {
                    if (deleteErr) {
                        return res.status(500).json({ 
                            error: 'Failed to delete team',
                            details: deleteErr.message
                        });
                    }
                    
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ error: 'Team not found' });
                    }
                    
                    res.json({ 
                        message: 'Team deleted and projects unassigned',
                        unassignedProjects: true
                    });
                }
            );
        }
    );
};
exports.getTeamMembers = (req, res) => {
    const query = `
        SELECT 
            e.id, 
            e.name, 
            e.email,
            e.role,
            e.specialty,
            t.name as team_name
        FROM employee e
        LEFT JOIN team t ON e.team_id = t.id
        WHERE e.role IN ('Developer', 'Tester', 'Designer')
        ORDER BY e.name ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur DB:', err);
            return res.status(500).json({ 
                error: 'Erreur lors de la récupération des membres' 
            });
        }
        
        // Formater les résultats si nécessaire
        const formattedResults = results.map(member => ({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            specialty: member.specialty,
            team: member.team_name || 'Non assigné'
        }));
        
        res.json(formattedResults);
    });
};