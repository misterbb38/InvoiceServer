const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    designation: {
        type: String,
        required: true,
    },
    prixUnitaire: {
        type: Number,
        required: true,
    },
    reference: {
        type: String,
        required: true,
        unique: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Produit', produitSchema);
