ScrumFlow - Projet de Sécurité

Présentation

ScrumFlow est une application web développée avec React, Express.js, SQLite et JWT.

Le dépôt contient deux branches :
- vulnerable : version vulnérable
- secure : version corrigée

Vulnérabilités étudiées

1. Absence d'authentification
La route GET /api/employees était accessible sans authentification.

2. Validation insuffisante des données
L'application acceptait une adresse e-mail invalide lors de la création d'un employé.

Technologies utilisées
- React
- Express.js
- SQLite
- JWT
- Material UI