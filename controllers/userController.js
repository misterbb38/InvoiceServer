const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../middleware/async.js');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/userModel'); // Ajustez le chemin selon votre structure
const Notification = require('../models/notificationModel.js')


// Middleware pour générer un token JWT

// Fonction pour générer un token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Expiration dans 7 jours
  });
};

// Inscription d'un nouvel utilisateur
exports.signup = asyncHandler(async (req, res) => {
  const { nom, prenom, email, password, adresse, telephone, logo, devise, nomEntreprise } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Un utilisateur existe déjà avec cet email');
  }

  // Créer un nouvel utilisateur
  const user = await User.create({
    nom,
    prenom,
    email,
    password, // Sera hashé automatiquement par le hook pre 'save'
    adresse,
    telephone,
    logo,
    devise,
    nomEntreprise,
    cleAcces: generateToken(this._id), // Génération du token JWT comme clé d'accès
    dateExpiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Date d'expiration dans 7 jours
  });

  if (user) {
    
    await Notification.create({
      userId: user._id,
      message: "Bienvenue ! Vous avez 7 jours d'essai gratuits. Profitez de nos services.",
    });
    res.status(201).json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      adresse: user.adresse,
      telephone: user.telephone,
      logo: user.logo,
      devise: user.devise,
      nomEntreprise: user.nomEntreprise,
      cleAcces: user.cleAcces,
      dateExpiration: user.dateExpiration,
      token: generateToken(user._id), // Envoi du token JWT pour authentification immédiate
    });
  } else {
    res.status(400);
    throw new Error('Données d\'utilisateur invalides');
  }
});

// Connexion d'un utilisateur
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Trouver l'utilisateur par email
  const user = await User.findOne({ email });

  // Vérifier le mot de passe et l'existence de l'utilisateur
  if (user && (await user.isCorrectPassword(password))) {
    // Vérifier si la clé d'accès est expirée
    
      res.json({
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        userType: user.userType, // Envoyer le type d'utilisateur pour utilisation côté front
        dateExpiration: user.dateExpiration,// Indiquer que la clé d'accès n'est pas expirée
        token: generateToken(user._id), // Générer un nouveau token pour la session
      });
    
  } else {
    res.status(401);
    throw new Error('Email ou mot de passe invalide');
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
    user.userType = req.body.userType || user.userType;
    // Mettre à jour le logo seulement si un nouveau fichier a été uploadé
    if (req.file) {
      user.logo = req.file.path;
    }
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
      userType: updatedUser.userType,
      logo: updatedUser.logo, // Assurez-vous que votre client gère correctement le chemin du fichier
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


// exports.assignAccessKey = asyncHandler(async (req, res) => {

exports.assignAccessKey = asyncHandler(async (req, res) => {
  const { userId, duree } = req.body; // Durée en mois

  // Générer une nouvelle clé d'accès et calculer la date d'expiration
  const cleAcces = uuidv4();
  const dateDebut = new Date(); // Date de début (aujourd'hui)
  const dateExpiration = new Date(dateDebut);
  dateExpiration.setMonth(dateExpiration.getMonth() + duree);

  // Mettre à jour l'utilisateur avec la nouvelle clé et la date d'expiration
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { cleAcces: cleAcces, dateExpiration: dateExpiration, abonnementStatus: 'active' } },
    { new: true } // Retourner l'utilisateur après la mise à jour
  );

  if (!updatedUser) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }

  // Créer une notification pour informer l'utilisateur
  const message = `Votre compte est activé du ${dateDebut.toLocaleDateString()} jusqu'au ${dateExpiration.toLocaleDateString()}.`;
  await Notification.create({
    userId: updatedUser._id,
    message: message,
  });

  res.status(200).json({ message: 'Clé d\'accès assignée avec succès et notification envoyée.', cleAcces, dateExpiration });
});



// Obtenir tous les utilisateurs de type simple
exports.getSimpleUsers = asyncHandler(async (req, res) => {
  const simpleUsers = await User.find({ userType: 'simple' }).select('-password');
  res.status(200).json({ success: true, data: simpleUsers });
});

