Rapport d'audit de sécurité

Projet : ScrumFlow

Vulnérabilité 1

Nom : Absence d'authentification

Description :
La route GET /api/employees était accessible sans authentification.

Risque :
Élevé

Correction :
Ajout du middleware d'authentification JWT.

----------------------------------------

Vulnérabilité 2

Nom : Validation insuffisante des données

Description :
L'application accepte une adresse e-mail invalide.

Exemple :
email = abc

Risque :
Moyen

Correction :
Ajout d'une validation du format de l'adresse e-mail avant l'enregistrement.

----------------------------------------

Conclusion

Deux vulnérabilités ont été identifiées :
- Absence d'authentification.
- Validation insuffisante des données.

Une branche « secure » présente les corrections apportées.