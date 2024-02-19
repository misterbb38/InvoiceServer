const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
  },
  prenom : {
    type: String,
    required: [true, 'Le nom du entreprise si vous j en avais'],
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} n'est pas une adresse email valide!`
    }
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
  },
  adresse: {
    type: String,
    required: [false, 'L\'adresse est optionnelle'],
  },
  telephone: {
    type: String,
    required: [false, 'Le téléphone est optionnel'],
  },
  logo: {
    type: String, // URL vers le logo de l'utilisateur ou de l'entreprise
    required: [false, 'Le logo est optionnel'],
  },
  devise: {
    type: String,
    required: [true, 'La devise est requise'],
    default: 'Fcfa',
  },
  userType: {
    type: String,
    enum: {
      values: ['simple', 'superadmin'],
      message: '{VALUE} n\'est pas un type d\'utilisateur valide'
    },
  nomEntreprise: {
      type: String,
      required: [false, 'Le nom de l\'entreprise est optionnel'],
    },
    
    default: 'simple',
  },
  stripeCustomerId: {
    type: String,
    required: false, // Non requis initialement, sera rempli après la création du client Stripe
  },
  abonnementStatus: {
    type: String,
    enum: ['active', 'trial', 'expired', 'cancelled'],
    default: 'trial',
  },
  trialEndsAt: {
    type: Date,
    required: false, // Calculé lors de l'inscription et basé sur la période d'essai de 7 jours
  },
    
}, { timestamps: true });

// Hook pour hasher le mot de passe avant de sauvegarder l'utilisateur
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Méthode pour vérifier le mot de passe lors de la connexion
userSchema.methods.isCorrectPassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
