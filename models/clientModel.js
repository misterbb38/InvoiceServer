const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClientSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Assurez-vous que cela correspond au nom de votre modèle utilisateur
        required: [true, 'L\'utilisateur est obligatoire']
    },
    name: { type: String, required: [true, 'Le nom est obligatoire'] },
    address: { type: String, required: [true, 'L\'adresse est obligatoire'] },
    email: { type: String, match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez remplir un email valide'], required: false }, 
    telephone: { type: String, required: [true, 'Le numéro est obligatoire'] },
    // Autres champs spécifiques au client
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
