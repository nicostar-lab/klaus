# 🚀 GUIDE DE DÉMARRAGE BACKEND - COVOITURAGE

## 📌 Qu'est-ce que le Backend ?

Le **backend** est la partie "invisible" de l'application qui :
- Gère la base de données (stockage des utilisateurs, trajets, réservations)
- Traite les requêtes du frontend (inscription, connexion, recherche)
- Sécurise les données (mots de passe, authentification)
- Exécute la logique métier (vérifier les places disponibles, calculer les prix)

**Analogie** : Si le frontend est la vitrine d'un magasin, le backend est l'entrepôt et la gestion !

---

## 📋 ÉTAPE 1 : Installation des outils nécessaires

### 1.1 Node.js (Moteur JavaScript côté serveur)

**Qu'est-ce que c'est ?** Node.js permet d'exécuter du JavaScript en dehors du navigateur.

**Installation :**
- Allez sur https://nodejs.org
- Téléchargez la version LTS (Long Term Support)
- Installez normalement

**Vérification :**
```bash
node --version
# Devrait afficher : v18.x.x ou v20.x.x

npm --version
# Devrait afficher : 9.x.x ou 10.x.x
```

### 1.2 MongoDB (Base de données)

**Qu'est-ce que c'est ?** MongoDB stocke vos données (comme une bibliothèque pour vos livres/documents).

**Option 1 : MongoDB Atlas (Cloud - RECOMMANDÉ pour débuter)**
- Allez sur https://www.mongodb.com/cloud/atlas
- Créez un compte gratuit
- Créez un cluster (c'est votre base de données en ligne)
- Récupérez votre "Connection String" (adresse de connexion)

**Option 2 : MongoDB Local**
- Téléchargez MongoDB Community Server
- Installez-le sur votre machine

### 1.3 Visual Studio Code (Éditeur de code)

**Téléchargement :** https://code.visualstudio.com

**Extensions recommandées :**
- "Thunder Client" (pour tester vos API)
- "MongoDB for VS Code"
- "ESLint" (détecte les erreurs)

---

## 📋 ÉTAPE 2 : Créer la structure du projet

### 2.1 Créer le dossier du projet

```bash
# Ouvrez votre terminal (CMD sur Windows, Terminal sur Mac/Linux)

# Créez un dossier pour votre projet
mkdir covoiturage-backend
cd covoiturage-backend

# Initialiser un projet Node.js
npm init -y
```

**Explication :**
- `mkdir` = créer un dossier
- `cd` = entrer dans le dossier
- `npm init -y` = crée un fichier `package.json` qui liste toutes vos dépendances

### 2.2 Installer les packages nécessaires

```bash
# Packages principaux
npm install express mongoose dotenv cors bcryptjs jsonwebtoken

# Packages de développement
npm install --save-dev nodemon
```

**Explication de chaque package :**

| Package | À quoi ça sert ? |
|---------|------------------|
| **express** | Framework pour créer l'API (les routes /api/users, /api/trajets, etc.) |
| **mongoose** | Pour communiquer avec MongoDB facilement |
| **dotenv** | Pour gérer les variables d'environnement (mots de passe, clés secrètes) |
| **cors** | Permet au frontend (React) de communiquer avec le backend |
| **bcryptjs** | Pour hasher (crypter) les mots de passe |
| **jsonwebtoken** | Pour créer des tokens d'authentification (comme un badge d'accès) |
| **nodemon** | Redémarre automatiquement le serveur quand vous modifiez le code |

### 2.3 Créer la structure des dossiers

```bash
# Créez tous les dossiers nécessaires
mkdir src
cd src
mkdir config models controllers routes middleware utils
cd ..
```

**Structure finale :**
```
covoiturage-backend/
├── node_modules/          (créé automatiquement par npm)
├── src/
│   ├── config/           (configuration de la base de données)
│   ├── models/           (schémas de données : User, Trajet, etc.)
│   ├── controllers/      (logique métier : que faire quand on reçoit une requête ?)
│   ├── routes/           (définir les URLs : /api/users, /api/trajets)
│   ├── middleware/       (fonctions intermédiaires : vérifier l'authentification)
│   ├── utils/            (fonctions utilitaires)
│   └── server.js         (point d'entrée de l'application)
├── .env                  (variables secrètes - NE JAMAIS COMMIT !)
├── .gitignore            (fichiers à ignorer par Git)
└── package.json          (configuration du projet)
```

---

## 📋 ÉTAPE 3 : Configuration de base

### 3.1 Créer le fichier .env

Ce fichier contient vos **secrets** (mots de passe, clés).

**Créez un fichier `.env` à la racine :**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/covoiturage
JWT_SECRET=votre_secret_super_securise_123456789
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

**⚠️ IMPORTANT :** Remplacez `MONGODB_URI` par votre connection string MongoDB Atlas si vous utilisez le cloud.

**Exemple MongoDB Atlas :**
```env
MONGODB_URI=mongodb+srv://votreuser:votrepassword@cluster0.xxxxx.mongodb.net/covoiturage?retryWrites=true&w=majority
```

### 3.2 Créer le fichier .gitignore

Ce fichier dit à Git ce qu'il ne doit **pas** sauvegarder.

**Créez un fichier `.gitignore` :**
```
node_modules/
.env
*.log
```

### 3.3 Modifier package.json

Ouvrez `package.json` et ajoutez dans la section `"scripts"` :

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

**Explication :**
- `npm start` : démarre le serveur normalement
- `npm run dev` : démarre avec nodemon (redémarre automatiquement)

---

## 📋 ÉTAPE 4 : Connexion à MongoDB

### 4.1 Créer le fichier de connexion

**Fichier : `src/config/database.js`**

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connexion à MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erreur MongoDB : ${error.message}`);
    process.exit(1); // Arrêter l'application si la connexion échoue
  }
};

module.exports = connectDB;
```

**Explication ligne par ligne :**
- `mongoose.connect()` : se connecte à MongoDB
- `process.env.MONGODB_URI` : récupère l'URL depuis le fichier .env
- `await` : attend que la connexion soit établie avant de continuer
- `try/catch` : gère les erreurs (si la connexion échoue)

---

## 📋 ÉTAPE 5 : Créer le serveur Express

### 5.1 Fichier principal

**Fichier : `src/server.js`**

```javascript
// 1. IMPORTER LES PACKAGES
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');

// 2. CHARGER LES VARIABLES D'ENVIRONNEMENT
dotenv.config();

// 3. CRÉER L'APPLICATION EXPRESS
const app = express();

// 4. MIDDLEWARE (fonctions qui s'exécutent avant les routes)
app.use(cors()); // Permet les requêtes cross-origin (frontend -> backend)
app.use(express.json()); // Permet de lire les données JSON dans les requêtes
app.use(express.urlencoded({ extended: true })); // Permet de lire les formulaires

// 5. ROUTE DE TEST
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Covoiturage - Backend opérationnel !',
    version: '1.0.0'
  });
});

// 6. ROUTE DE SANTÉ (pour vérifier que l'API fonctionne)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 7. CONNEXION À LA BASE DE DONNÉES
connectDB();

// 8. DÉMARRER LE SERVEUR
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 URL : http://localhost:${PORT}`);
});
```

**Explication :**
- **Ligne 1-4** : On importe les outils nécessaires
- **Ligne 7** : On charge les variables du fichier .env
- **Ligne 10** : On crée l'application Express
- **Ligne 13-15** : Middleware = fonctions qui traitent les requêtes avant qu'elles arrivent aux routes
- **Ligne 18-22** : Route de test (GET http://localhost:5000/)
- **Ligne 28** : On se connecte à MongoDB
- **Ligne 31-34** : On démarre le serveur sur le port 5000

---

## 📋 ÉTAPE 6 : Tester le serveur

### 6.1 Démarrer le serveur

Dans le terminal :
```bash
npm run dev
```

**Vous devriez voir :**
```
🚀 Serveur démarré sur le port 5000
📍 URL : http://localhost:5000
✅ MongoDB connecté : cluster0-xxxxx.mongodb.net
```

### 6.2 Tester avec le navigateur

Ouvrez votre navigateur et allez sur : http://localhost:5000

**Vous devriez voir :**
```json
{
  "message": "🚀 API Covoiturage - Backend opérationnel !",
  "version": "1.0.0"
}
```

🎉 **FÉLICITATIONS !** Votre backend fonctionne !

---

## 🎯 PROCHAINES ÉTAPES

Maintenant que votre serveur fonctionne, vous allez :

1. ✅ Créer les **modèles** (User, Trajet, Reservation)
2. ✅ Créer les **routes** (/api/auth/register, /api/trajets)
3. ✅ Créer les **controllers** (logique métier)
4. ✅ Ajouter l'**authentification** (JWT)
5. ✅ Tester avec **Thunder Client** ou **Postman**

---

## 🆘 PROBLÈMES COURANTS

### ❌ "Cannot find module 'express'"
**Solution :** Vous n'avez pas installé les packages
```bash
npm install
```

### ❌ "Port 5000 is already in use"
**Solution :** Un autre programme utilise le port 5000
- Changez le port dans `.env` : `PORT=5001`
- Ou arrêtez l'autre programme

### ❌ "Error: querySrv ENOTFOUND"
**Solution :** Problème de connexion MongoDB
- Vérifiez votre `MONGODB_URI` dans `.env`
- Vérifiez votre connexion internet
- Vérifiez que votre IP est autorisée sur MongoDB Atlas

### ❌ "nodemon: command not found"
**Solution :** nodemon n'est pas installé globalement
```bash
npm install -g nodemon
```
Ou utilisez : `npx nodemon src/server.js`

---

## 📚 RESSOURCES UTILES

- **Documentation Express :** https://expressjs.com
- **Documentation Mongoose :** https://mongoosejs.com
- **Documentation MongoDB :** https://www.mongodb.com/docs
- **Tester vos API :** Thunder Client (extension VS Code) ou Postman

---

## ✅ CHECKLIST DE DÉMARRAGE

- [ ] Node.js installé (node --version fonctionne)
- [ ] MongoDB configuré (local ou Atlas)
- [ ] Projet initialisé (npm init -y)
- [ ] Packages installés (npm install)
- [ ] Structure de dossiers créée
- [ ] Fichier .env créé avec vos variables
- [ ] Fichier .gitignore créé
- [ ] Connexion à MongoDB fonctionne
- [ ] Serveur démarre sans erreur (npm run dev)
- [ ] Route de test accessible (http://localhost:5000)

**Si tous les points sont cochés, vous êtes prêt pour la suite ! 🚀**
