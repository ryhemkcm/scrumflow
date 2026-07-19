
const db = require('../config/db');

exports.getAllRoles = (req, res) => {
    // Query to get roles and their counts
    const roleCountQuery = `
        SELECT role, COUNT(*) AS count
        FROM Employee
        GROUP BY role;
    `;

    // Queries to get lists of names for each role
    const productOwnersNamesQuery = `
        SELECT name FROM Employee WHERE role = 'Product Owner';
    `;
    const scrumMastersNamesQuery = `
        SELECT name FROM Employee WHERE role = 'Scrum Master';
    `;
    const developersNamesQuery = `
        SELECT name FROM Employee WHERE role = 'Developer';
    `;

    // Queries for teams and projects (assuming 'name' column exists)
    const teamDetailsQuery = `
        SELECT name FROM Team;
    `;
    const projectDetailsQuery = `
        SELECT name FROM Projects;
    `;

    // Initialize the response structure
    const rolesData = {
        productOwners: { count: 0, employees: [] },
        scrumMasters: { count: 0, employees: [] },
        developers: { count: 0, employees: [] },
        teams: { count: 0, details: [] },
        projects: { count: 0, details: [] }
    };

    // Start with the role counts query
    db.query(roleCountQuery, (err, roleCountResults) => {
        if (err) {
            console.error('Error fetching role counts:', err);
            return res.status(500).json({ error: 'Erreur lors de la récupération des comptes de rôles' });
        }

        roleCountResults.forEach((row) => {
            const role = row.role.toLowerCase();
            if (role === 'product owner') rolesData.productOwners.count = row.count;
            if (role === 'scrum master') rolesData.scrumMasters.count = row.count;
            if (role === 'developer') rolesData.developers.count = row.count;
        });

        // Query for Product Owners names
        db.query(productOwnersNamesQuery, (err, productOwnersResult) => {
            if (err) {
                console.error('Error fetching Product Owners names:', err);
                return res.status(500).json({ error: 'Erreur lors de la récupération des noms des Product Owners' });
            }
            rolesData.productOwners.employees = productOwnersResult.map(row => row.name);

            // Query for Scrum Masters names
            db.query(scrumMastersNamesQuery, (err, scrumMastersResult) => {
                if (err) {
                    console.error('Error fetching Scrum Masters names:', err);
                    return res.status(500).json({ error: 'Erreur lors de la récupération des noms des Scrum Masters' });
                }
                rolesData.scrumMasters.employees = scrumMastersResult.map(row => row.name);

                // Query for Developers names
                db.query(developersNamesQuery, (err, developersResult) => {
                    if (err) {
                        console.error('Error fetching Developers names:', err);
                        return res.status(500).json({ error: 'Erreur lors de la récupération des noms des Développeurs' });
                    }
                    rolesData.developers.employees = developersResult.map(row => row.name);

                    // Query for Team details
                    db.query(teamDetailsQuery, (err, teamResult) => {
                        if (err) {
                            console.error('Error fetching Team details:', err);
                            return res.status(500).json({ error: 'Erreur lors de la récupération des détails des Équipes' });
                        }
                        rolesData.teams.count = teamResult.length;
                        rolesData.teams.details = teamResult.map(row => row.name);

                        // Query for Project details
                        db.query(projectDetailsQuery, (err, projectResult) => {
                            if (err) {
                                console.error('Error fetching Project details:', err);
                                return res.status(500).json({ error: 'Erreur lors de la récupération des détails des Projets' });
                            }
                            rolesData.projects.count = projectResult.length;
                            rolesData.projects.details = projectResult.map(row => row.name);

                            // All queries completed, send the final response
                            return res.json(rolesData);
                        });
                    });
                });
            });
        });
    });
};