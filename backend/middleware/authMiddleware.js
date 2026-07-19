const jwt = require("jsonwebtoken");

const authenticateAdmin = (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (
        !authorizationHeader ||
        !authorizationHeader.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            message: "Authentification requise.",
        });
    }

    const token = authorizationHeader.split(" ")[1];

    try {
        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decodedToken.role !== "administrator") {
            return res.status(403).json({
                message: "Accès réservé à l’administrateur.",
            });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Token invalide ou expiré.",
        });
    }
};

module.exports = authenticateAdmin;