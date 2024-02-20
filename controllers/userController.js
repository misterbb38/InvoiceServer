const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../middleware/async.js');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/userModel'); // Ajustez le chemin selon votre structure

// Middleware pour générer un token JWT
const generateToken = (id, isSecure = false) => {
  const secret = isSecure ? process.env.JWT_SECRET_SECURE : process.env.JWT_SECRET;
  const expiresIn = isSecure ? '15m' : '30d'; // 15 minutes pour les tokens sécurisés

  return jwt.sign({ id }, secret, { expiresIn });
};
const generateAccessKeyToken = (user) => {
  const payload = {
    id: user._id,
    cleValide: user.dateExpiration > new Date(),
    userType: user.userType,
  };

  return jwt.sign(payload, process.env.ACCESS_KEY_JWT_SECRET, { expiresIn: '1h' });
};

// Inscription d'un nouvel utilisateur
exports.signup = asyncHandler(async (req, res) => {
  const { nom, prenom, email, password, adresse, telephone, logo, devise } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const userExists = await User.findOne({ email });
  if (userExists) {
    // Ici, au lieu de lancer une erreur, nous envoyons directement la réponse au client
    return res.status(400).json({ success: false, message: 'Un utilisateur existe déjà avec cet email.' });
  }

  // Hachage du mot de passe et création de l'utilisateur
  const user = await User.create({
    nom, prenom, email, password, adresse, telephone,
    logo: req.file ? req.file.path : logo, // Utiliser le chemin du fichier uploadé si disponible
    devise
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        adresse: user.adresse,
        telephone: user.telephone,
        logo: user.logo,
        devise: user.devise,
        token: generateToken(user._id),
      }
    });
  } else {
    // Si la création de l'utilisateur échoue pour une autre raison
    return res.status(400).json({ success: false, message: 'Erreur lors de la création de l\'utilisateur.' });
  }
});


// Connexion d'un utilisateur
// exports.login = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });

//   if (user && (await bcrypt.compare(password, user.password))) {
//     res.json({
//       _id: user._id,
//       nom: user.nom,
//       prenom: user.prenom,
//       email: user.email,
//       userType: user.userType,
//       adresse: user.adresse,
//       telephone: user.telephone,
//       logo: user.logo,
//       devise: user.devise,
//       token: generateToken(user._id),
//     });
//   } else {
//     res.status(401);
//     throw new Error('Email ou mot de passe incorrect.');
//   }
// });
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = generateToken(user._id);
    const accessKeyToken = generateAccessKeyToken(user); // Génère un token pour la clé d'accès

    res.json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      userType: user.userType,
      adresse: user.adresse,
      telephone: user.telephone,
      logo: user.logo,
      devise: user.devise,
      token, // Token d'authentification
      accessKeyToken, // Token pour la vérification de la clé d'accès
    });
  } else {
    res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
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
// exports.updateProfile = asyncHandler(async (req, res) => {
//     const user = await User.findById(req.user._id);

//     if (user) {
//       user.nom = req.body.nom || user.nom;
//       user.prenom = req.body.prenom || user.prenom;
//       user.email = req.body.email || user.email;
//       user.adresse = req.body.adresse || user.adresse;
//       user.telephone = req.body.telephone || user.telephone;
//       user.logo = req.body.logo || user.logo;
//       user.devise = req.body.devise || user.devise;

//       // Vérifiez si un nouveau mot de passe est fourni
//       if (req.body.password) {
//         // Hacher le nouveau mot de passe avant de le sauvegarder
//         const salt = await bcrypt.genSalt(10);
//         user.password = await bcrypt.hash(req.body.password, salt);
//       }

//       const updatedUser = await user.save();

//       res.json({
//         _id: updatedUser._id,
//         nom: updatedUser.nom,
//         prenom: updatedUser.prenom,
//         email: updatedUser.email,
//         adresse: updatedUser.adresse,
//         telephone: updatedUser.telephone,
//         logo: updatedUser.logo,
//         devise: updatedUser.devise,
//         token: generateToken(updatedUser._id), // Générer un nouveau token avec le profil mis à jour
//       });
//     } else {
//       res.status(404);
//       throw new Error('Utilisateur non trouvé.');
//     }
//   });
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
//   const { userId, duree } = req.body; // duree en mois
//   const user = await User.findById(userId);

//   if (!user) {
//     return res.status(404).json({ message: 'Utilisateur non trouvé' });
//   }

//   // Générer une nouvelle clé d'accès et calculer la date d'expiration
//   const cleAcces = uuidv4();
//   const dateExpiration = new Date();
//   dateExpiration.setMonth(dateExpiration.getMonth() + duree);

//   // Mettre à jour l'utilisateur avec la nouvelle clé et la date d'expiration
//   user.cleAcces = cleAcces;
//   user.dateExpiration = dateExpiration;
//   await user.save();

//   res.status(200).json({ message: 'Clé d\'accès assignée avec succès', cleAcces, dateExpiration });
// });
exports.assignAccessKey = asyncHandler(async (req, res) => {
  const { userId, duree } = req.body; // duree en mois

  // Générer une nouvelle clé d'accès et calculer la date d'expiration
  const cleAcces = uuidv4();
  const dateExpiration = new Date();
  dateExpiration.setMonth(dateExpiration.getMonth() + duree);

  // Mettre à jour l'utilisateur avec la nouvelle clé et la date d'expiration
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { cleAcces: cleAcces, dateExpiration: dateExpiration, abonnementStatus: 'active'  } },
    { new: true } // Retourner l'utilisateur après la mise à jour
  );

  if (!updatedUser) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }

  res.status(200).json({ message: 'Clé d\'accès assignée avec succès', cleAcces, dateExpiration });
});


// Obtenir tous les utilisateurs de type simple
exports.getSimpleUsers = asyncHandler(async (req, res) => {
  const simpleUsers = await User.find({ userType: 'simple' }).select('-password');
  res.status(200).json({ success: true, data: simpleUsers });
});

