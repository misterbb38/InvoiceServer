const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../middleware/async.js');
const User = require('../models/userModel'); // Ajustez le chemin selon votre structure

// Middleware pour générer un token JWT
const generateToken = (id, isSecure = false) => {
    const secret = isSecure ? process.env.JWT_SECRET_SECURE : process.env.JWT_SECRET;
    const expiresIn = isSecure ? '15m' : '30d'; // 15 minutes pour les tokens sécurisés
  
    return jwt.sign({ id }, secret, { expiresIn });
  };

// Inscription d'un nouvel utilisateur
exports.signup = asyncHandler(async (req, res) => {
  const { nom, prenom , email, password, adresse, telephone, logo, devise } = req.body;
  
  // Vérifier si l'utilisateur existe déjà
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Un utilisateur existe déjà avec cet email.');
  }

  // Hachage du mot de passe et création de l'utilisateur
  const user = await User.create({
    nom, prenom, email, password, adresse, telephone, logo, devise
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      adresse: user.adresse,
      telephone: user.telephone,
      logo: user.logo,
      devise: user.devise,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Erreur lors de la création de l\'utilisateur.');
  }
});

// Connexion d'un utilisateur
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      adresse: user.adresse,
      telephone: user.telephone,
      logo: user.logo,
      devise: user.devise,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Email ou mot de passe incorrect.');
  }
});

// Obtenir le profil de l'utilisateur
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      adresse: user.adresse,
      telephone: user.telephone,
      logo: user.logo,
      devise: user.devise,
    });
  } else {
    res.status(404);
    throw new Error('Utilisateur non trouvé.');
  }
});

// Modifier le profil de l'utilisateur
exports.updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
  
    if (user) {
      user.nom = req.body.nom || user.nom;
      user.prenom = req.body.prenom || user.prenom;
      user.email = req.body.email || user.email;
      user.adresse = req.body.adresse || user.adresse;
      user.telephone = req.body.telephone || user.telephone;
      user.logo = req.body.logo || user.logo;
      user.devise = req.body.devise || user.devise;
  
      // Vérifiez si un nouveau mot de passe est fourni
      if (req.body.password) {
        // Hacher le nouveau mot de passe avant de le sauvegarder
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }
  
      const updatedUser = await user.save();
  
      res.json({
        _id: updatedUser._id,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        email: updatedUser.email,
        adresse: updatedUser.adresse,
        telephone: updatedUser.telephone,
        logo: updatedUser.logo,
        devise: updatedUser.devise,
        token: generateToken(updatedUser._id), // Générer un nouveau token avec le profil mis à jour
      });
    } else {
      res.status(404);
      throw new Error('Utilisateur non trouvé.');
    }
  });
  

// Supprimer un utilisateur
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    await user.remove();
    res.json({ message: 'Utilisateur supprimé.' });
  } else {
    res.status(404);
    throw new Error('Utilisateur non trouvé.');
  }
});
