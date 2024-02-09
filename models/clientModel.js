const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClientSchema = new Schema({
    name: { type: String, required: [true, 'Le nom est obligatoire'] },
    address: { type: String, required: [true, 'L\'adresse est obligatoire'] },
    email: { type: String }, 
    telephone: { type: String, required: [true, 'Le numéro est obligatoire'] },
    // Autres champs spécifiques au client
});

module.exports = mongoose.model('Client', ClientSchema);
