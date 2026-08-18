# PubArt — Micro-Blog

Micro-blog permettant de consulter, publier et supprimer des articles, avec une interface simple et un mode administrateur protégé par mot de passe.

## Fonctionnalités

- Affichage des derniers articles publiés (avec option "Voir tous / Voir moins")
- Publication d'un article (titre, catégorie, contenu, image optionnelle)
- Suppression d'un article (réservée aux administrateurs)
- Mode administrateur via mot de passe (stocké en session, requête sécurisée par header)
- Gestion des images cassées (affichage d'un placeholder)
- Interface responsive (desktop, tablette, mobile)

## Stack technique

**Frontend**

- HTML / CSS / JavaScript
- Bootstrap Icons

**Backend**

- [Node.js] + [Express]
- [MySQL2]
- [CORS]
- [dotenv]

## Structure du projet

```
.

│── index.html
│── css/
│     └── style.css
│── js/
│     └── app.js
├── server.js
├── .env
├── .gitignore
└── README.md
```

## Prérequis

- [Node.js] (v16 ou supérieur recommandé)
- Un serveur [MySQL]

## Installation

1. Cloner le dépôt

   ```bash
   git clone https://github.com/sedynohmg/Micro-blog.git
   cd JAVASCRIPT
   ```

2. Installer les dépendances

   ```bash
   npm install
   ```

3. Créer la base de données et la table `articles` :

   ```sql
   CREATE DATABASE micro_blog;

   USE micro_blog;

   CREATE TABLE articles (
     id INT AUTO_INCREMENT PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     category VARCHAR(100) NOT NULL,
     content TEXT NOT NULL,
     image VARCHAR(5000),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. Créer un fichier `.env` à la racine du projet (voir ci-dessous)

5. Lancer le serveur

   ```bash
   node server.js
   ```

6. Ouvrir le navigateur sur : `http://localhost:3000`

## Variables d'environnement

Créer un fichier `.env` à la racine avec les variables suivantes :

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mot_de_passe
DB_NAME=pubart
DB_PORT=3306
ADMIN_PASSWORD=mot_de_passe_admin
```

## API — Endpoints

| Méthode  | Route           | Description                    | Auth requise                    |
| -------- | --------------- | ------------------------------ | ------------------------------- |
| `GET`    | `/articles`     | Récupère la liste des articles | Non                             |
| `POST`   | `/articles`     | Crée un nouvel article         | Non                             |
| `DELETE` | `/articles/:id` | Supprime un article            | Oui (header `x-admin-password`) |

### Exemple — POST /articles

```json
{
  "title": "Mon article",
  "category": "Technologie",
  "content": "Le contenu de mon article...",
  "image": "https://exemple.com/image.jpg"
}
```

### Exemple — DELETE /articles/:id

```bash
curl -X DELETE http://localhost:3000/articles/1 \
  -H "x-admin-password: votre_mot_de_passe_admin"
```

## Mode administrateur (frontend)

Cliquer sur le bouton **Administrateur** dans l'en-tête et saisir le mot de passe défini dans `ADMIN_PASSWORD`. Une fois activé, les boutons de suppression apparaissent sur chaque article.

> Le mot de passe est stocké dans `sessionStorage` côté client à des fins de démonstration. Pour une application en production, privilégier une authentification par token (JWT) côté serveur.

## Auteur

- GitHub : [@sedynohmg](https://github.com/sedynohmg)

## Licence

Ce projet est distribué sous licence libre à des fins d'apprentissage.
