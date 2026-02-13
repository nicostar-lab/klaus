const User = require('../models/User');
const jwt = require('jsonwebtoken');



const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },                    // Payload : données à encoder
    process.env.JWT_SECRET,            // Secret pour signer le token
    { expiresIn: process.env.JWT_EXPIRE }  // Durée de validité (ex: 7d)
  );
};


exports.register = async (req, res) => {
  try {

    //  Récupérer les données du corps de la requête

    const { nom, prenom, email, password, telephone } = req.body;
    
    // Vérifier que tous les champs requis sont présents

    if (!nom || !prenom || !email || !password || !telephone) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires'
      });
    }
    
    //  Vérifier si l'utilisateur existe déjà

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }
    
    //  Créer le nouvel utilisateur

    const user = await User.create({
      nom,
      prenom,
      email,
      password,  // Le password sera hashé automatiquement (voir modèle User)
      telephone
    });
    
    //  Générer un token JWT

    const token = generateToken(user._id);
    
    //  Retourner la réponse avec le token et les infos de l'utilisateur

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: user.getPublicProfile()  // Utilise la méthode du modèle pour ne pas exposer le password
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message
    });
  }
};


exports.login = async (req, res) => {
  try {
    // 1. Récupérer email et password
    const { email, password } = req.body;
    
    // 2. Vérifier que les champs sont fournis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }
    
    //  Chercher l'utilisateur par email (et inclure le password)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    //  Vérifier le mot de passe
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    
    //  Vérifier que le compte est actif

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé. Contactez le support.'
      });
    }
    
    //  Générer un token

    const token = generateToken(user._id);
    
    // Retourner la réponse

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: user.getPublicProfile()
    });
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion',
      error: error.message
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user est ajouté par le middleware authMiddleware

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      user: user.getPublicProfile()
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Vérifier que les champs sont fournis

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Ancien et nouveau mot de passe requis'
      });
    }
    
    // Récupérer l'utilisateur avec le password

    const user = await User.findById(req.user.id).select('+password');
    
    // Vérifier l'ancien mot de passe

    const isPasswordMatch = await user.comparePassword(currentPassword);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }
    
    // Mettre à jour le mot de passe

    user.password = newPassword;
    await user.save();  // Le pre-save hook hashera le nouveau password
    
    // Générer un nouveau token
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
      token
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
