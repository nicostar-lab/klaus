# 🧪 GUIDE DE PREMIER TEST - Étape par étape

Ce guide vous accompagne pour tester votre backend pour la première fois.

---

## ✅ CHECKLIST AVANT DE COMMENCER

Avant de tester, assurez-vous que :

- [ ] Node.js est installé (`node --version` fonctionne)
- [ ] Vous avez créé le fichier `.env` avec vos configurations
- [ ] Vous avez exécuté `npm install`
- [ ] MongoDB est accessible (local ou Atlas)

---

## 📝 ÉTAPE 1 : Démarrer le serveur

### 1.1 Ouvrez un terminal dans le dossier du projet

```bash
cd /chemin/vers/covoiturage-backend
```

### 1.2 Démarrez le serveur en mode développement

```bash
npm run dev
```

### 1.3 Vérifiez les messages dans le terminal

Vous devriez voir :

```
========================================
🚀 SERVEUR DÉMARRÉ
========================================
📍 Port          : 5000
🌍 Environnement : development
🔗 URL           : http://localhost:5000
📚 API Docs      : http://localhost:5000/
========================================

✅ MongoDB connecté avec succès
📍 Host: cluster0-xxxxx.mongodb.net (ou localhost)
📊 Base de données: covoiturage
🔗 Mongoose connecté à MongoDB
```

**Si vous voyez ces messages : PARFAIT ! ✅**

**Si vous voyez des erreurs :** 
- Erreur MongoDB ? Vérifiez votre `MONGODB_URI`
- Port déjà utilisé ? Changez `PORT` dans `.env`

---

## 🌐 ÉTAPE 2 : Tester avec le navigateur

### 2.1 Ouvrez votre navigateur

Allez sur : **http://localhost:5000**

### 2.2 Vous devriez voir :

```json
{
  "message": "🚀 API Covoiturage Universitaire",
  "version": "1.0.0",
  "status": "En cours de développement",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "trajets": "/api/trajets",
    "reservations": "/api/reservations",
    "evaluations": "/api/evaluations"
  }
}
```

**Si vous voyez ça : BRAVO ! Votre API fonctionne ! 🎉**

---

## 🔧 ÉTAPE 3 : Installer Thunder Client (VS Code)

Thunder Client est un outil pour tester les API directement dans VS Code.

### 3.1 Dans VS Code

1. Cliquez sur l'icône "Extensions" (carré avec 4 carrés)
2. Recherchez "Thunder Client"
3. Cliquez sur "Install"

### 3.2 Ouvrir Thunder Client

1. Cliquez sur l'icône ⚡ dans la barre latérale gauche
2. Cliquez sur "New Request"

---

## 📤 ÉTAPE 4 : Tester l'inscription (Register)

### 4.1 Créer la requête

Dans Thunder Client :

1. **Méthode** : Sélectionnez `POST`
2. **URL** : `http://localhost:5000/api/auth/register`
3. **Body** : Cliquez sur "Body" → "JSON"
4. Collez ce JSON :

```json
{
  "nom": "Test",
  "prenom": "Utilisateur",
  "email": "test@example.com",
  "password": "password123",
  "telephone": "0612345678"
}
```

5. Cliquez sur **"Send"** ⚡

### 4.2 Réponse attendue

Vous devriez recevoir :

```json
{
  "success": true,
  "message": "Inscription réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "676a1234567890abcdef1234",
    "nom": "Test",
    "prenom": "Utilisateur",
    "email": "test@example.com",
    "telephone": "0612345678",
    "photo": "default-avatar.png",
    "note_moyenne": 0,
    "nb_evaluations": 0
  }
}
```

### 4.3 Que vérifier ?

✅ `success: true`  
✅ Un `token` est présent  
✅ Les informations de l'utilisateur sont correctes

**IMPORTANT :** Copiez le `token` quelque part, vous en aurez besoin !

---

## 🔐 ÉTAPE 5 : Tester la connexion (Login)

### 5.1 Créer une nouvelle requête

1. Cliquez sur "New Request"
2. **Méthode** : `POST`
3. **URL** : `http://localhost:5000/api/auth/login`
4. **Body** : JSON

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

5. Cliquez sur **"Send"**

### 5.2 Réponse attendue

```json
{
  "success": true,
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Si vous recevez un token : EXCELLENT ! L'authentification fonctionne ! 🎉**

---

## 👤 ÉTAPE 6 : Tester une route protégée (Get Me)

Cette étape teste l'authentification avec token.

### 6.1 Créer une nouvelle requête

1. **Méthode** : `GET`
2. **URL** : `http://localhost:5000/api/auth/me`
3. **Headers** : Cliquez sur "Headers"
4. Ajoutez un header :
   - **Key** : `Authorization`
   - **Value** : `Bearer <votre_token>`
   
   Remplacez `<votre_token>` par le token que vous avez copié (étape 4 ou 5)
   
   Exemple :
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NmExMjM0NTY3ODkwYWJjZGVmMTIzNCIsImlhdCI6MTczNTA0MTYwMCwiZXhwIjoxNzM1NjQ2NDAwfQ.xxxxx
   ```

5. Cliquez sur **"Send"**

### 6.2 Réponse attendue

```json
{
  "success": true,
  "user": {
    "id": "676a1234567890abcdef1234",
    "nom": "Test",
    "prenom": "Utilisateur",
    "email": "test@example.com",
    ...
  }
}
```

**Si vous recevez vos informations : PARFAIT ! La protection des routes fonctionne ! 🛡️**

---

## ❌ ÉTAPE 7 : Tester sans token (pour vérifier la sécurité)

### 7.1 Même requête mais SANS le header Authorization

1. Gardez la même requête GET `/api/auth/me`
2. **Supprimez** le header Authorization
3. Cliquez sur **"Send"**

### 7.2 Réponse attendue

```json
{
  "success": false,
  "message": "Non autorisé - Token manquant"
}
```

**Si vous recevez cette erreur : EXCELLENT ! La sécurité fonctionne ! 🔒**

Cela signifie que les routes protégées ne sont pas accessibles sans authentification.

---

## 🎓 ÉTAPE 8 : Vérifier dans MongoDB

### 8.1 Si vous utilisez MongoDB Atlas

1. Allez sur https://cloud.mongodb.com
2. Connectez-vous
3. Cliquez sur "Browse Collections"
4. Vous devriez voir :
   - Database : `covoiturage`
   - Collection : `users`
   - 1 document (l'utilisateur que vous avez créé)

### 8.2 Si vous utilisez MongoDB local

Installez MongoDB Compass (interface graphique) :
1. Téléchargez : https://www.mongodb.com/products/compass
2. Connectez-vous à `mongodb://localhost:27017`
3. Ouvrez la base `covoiturage`
4. Collection `users` → vous devriez voir votre utilisateur

---

## 🧪 ÉTAPE 9 : Tests supplémentaires (Optionnel)

### Test 1 : Email déjà utilisé

Essayez de créer un autre compte avec le même email.

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Un utilisateur avec cet email existe déjà"
}
```

### Test 2 : Mot de passe incorrect

Essayez de vous connecter avec un mauvais mot de passe.

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect"
}
```

### Test 3 : Champs manquants

Essayez de vous inscrire sans fournir le nom.

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Tous les champs sont obligatoires"
}
```

---

## ✅ RÉCAPITULATIF

Si tous les tests ont réussi, vous avez :

- ✅ Un serveur backend qui fonctionne
- ✅ Une connexion MongoDB opérationnelle
- ✅ Un système d'inscription qui fonctionne
- ✅ Un système de connexion qui fonctionne
- ✅ Une authentification JWT qui protège les routes
- ✅ Une validation des données qui fonctionne
- ✅ Des utilisateurs stockés dans MongoDB

**FÉLICITATIONS ! 🎉 Votre backend est opérationnel !**

---

## 🚀 PROCHAINES ÉTAPES

Maintenant que votre base fonctionne, vous pouvez :

1. **Créer les routes pour les trajets**
   - POST /api/trajets (créer un trajet)
   - GET /api/trajets (lister les trajets)
   - GET /api/trajets/:id (détails d'un trajet)

2. **Créer les routes pour les réservations**
   - POST /api/reservations (réserver une place)
   - GET /api/reservations (mes réservations)

3. **Ajouter la recherche de trajets**
   - GET /api/trajets/search?ville_depart=Paris&ville_arrivee=Lyon

4. **Tester avec le frontend** quand il sera prêt

---

## 🆘 AIDE

Si quelque chose ne fonctionne pas :

1. **Lisez les messages d'erreur** dans le terminal
2. **Vérifiez votre fichier .env**
3. **Vérifiez que MongoDB est accessible**
4. **Relancez le serveur** (`Ctrl+C` puis `npm run dev`)
5. **Demandez de l'aide à l'équipe**

---

**Bon développement ! 💪**
