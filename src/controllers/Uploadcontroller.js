const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

/**
 * @desc    Upload photo de profil
 * @route   POST /api/upload/profile-photo
 * @access  Private
 */
exports.uploadProfilePhoto = [
  upload.single('photo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier fourni'
        });
      }

      // Récupérer l'utilisateur
      const user = await User.findById(req.user.id);

      if (!user) {
        // Supprimer le fichier uploadé
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Supprimer l'ancienne photo si elle existe et n'est pas la photo par défaut
      if (user.photo && user.photo !== 'default-avatar.png') {
        const oldPhotoPath = path.join(uploadDir, user.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Mettre à jour l'utilisateur avec le nouveau nom de fichier
      user.photo = req.file.filename;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Photo de profil mise à jour avec succès',
        photo: req.file.filename,
        photoUrl: `/uploads/${req.file.filename}`
      });

    } catch (error) {
      // Supprimer le fichier en cas d'erreur
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Erreur lors de l\'upload:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload de la photo',
        error: error.message
      });
    }
  }
];

/**
 * @desc    Upload photo de véhicule
 * @route   POST /api/upload/vehicle-photo
 * @access  Private
 */
exports.uploadVehiclePhoto = [
  upload.single('photo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier fourni'
        });
      }

      // TODO: Associer la photo à un véhicule si le modèle Vehicule existe

      res.status(200).json({
        success: true,
        message: 'Photo de véhicule uploadée avec succès',
        photo: req.file.filename,
        photoUrl: `/uploads/${req.file.filename}`
      });

    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      console.error('Erreur lors de l\'upload:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload de la photo',
        error: error.message
      });
    }
  }
];

/**
 * @desc    Supprimer une photo
 * @route   DELETE /api/upload/:filename
 * @access  Private
 */
exports.deletePhoto = async (req, res) => {
  try {
    const { filename } = req.params;

    // Vérifier que le fichier appartient à l'utilisateur
    if (!filename.includes(`user-${req.user.id}`)) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      // Si c'était la photo de profil, réinitialiser
      const user = await User.findById(req.user.id);
      if (user && user.photo === filename) {
        user.photo = 'default-avatar.png';
        await user.save();
      }

      res.status(200).json({
        success: true,
        message: 'Photo supprimée avec succès'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

/**
 * Middleware pour gérer les erreurs multer
 */
exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux (max 5MB)'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erreur d'upload: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = exports;