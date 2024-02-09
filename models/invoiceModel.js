const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceItemSchema = new Schema({
    ref: { type: String, required: [true, 'La référence est obligatoire'] },
    description: { type: String, required: [true, 'La description est obligatoire'] },
    quantity: { type: Number, required: [true, 'La quantité est obligatoire'], min: [0, 'La quantité ne peut pas être négative'] },
    price: { type: Number, required: [true, 'Le prix est obligatoire'], min: [0, 'Le prix ne peut pas être négatif'] },
    total: { type: Number, required: [true, 'Le total est obligatoire'] }
});



const InvoiceSchema = new Schema({
    Client: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: false // Le client n'est pas obligatoire si les infos sont directement fournies
    },
    client: {
        name: { type: String, required: [true, 'Le nom du client est obligatoire'] },
        address: { type: String, required: [true, 'L\'adresse du client est obligatoire'] },
        email: { type: String},
        telephone: { type: String, required: [true, 'Le numero du client est obligatoire'] },
    },
    items: [InvoiceItemSchema],
    date: { type: Date, default: Date.now },
    total: { type: Number, required: [true, 'Le total de la facture est obligatoire'] },
    type: { type: String, enum: { values: ['devis', 'facture'], message: 'Le type doit être devis ou facture' }, required: [true, 'Le type de document est obligatoire'] },
    status: { type: String, enum: { values: ['pending', 'paid', 'cancelled'], message: 'Le statut doit être pending, paid ou cancelled' }, default: 'pending' }
});



module.exports = mongoose.model('Invoice', InvoiceSchema);
