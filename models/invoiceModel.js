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
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'L\'utilisateur est obligatoire']
    },
    Client: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: false // Le client n'est pas obligatoire si les infos sont directement fournies
    },
    client: {
        name: { type: String, required: [true, 'Le nom du client est obligatoire'] },
        address: { type: String, required: [true, 'L\'adresse du client est obligatoire'] },
        email: { type: String },
        telephone: { type: String, required: [true, 'Le numéro du client est obligatoire'] },
    },
    items: [InvoiceItemSchema],
    invoiceNumber: { type: Number, required: [true, 'Le numéro de facture est obligatoire'] },
    date: { type: Date, default: Date.now },
    total: { type: Number, required: true },
    type: { type: String, enum: ['devis', 'facture'], required: [true, 'Le type de document est obligatoire'] },
    status: { type: String, enum: [ 'Attente', 'Payée', 'Annullée', 'Attente', 'Payée', 'Annullée'], default: 'Attente' }
}, { timestamps: true });

// Middleware pour calculer le total de la facture avant de sauvegarder
InvoiceSchema.pre('save', function(next) {
    // Calcul du total en additionnant les totaux des items
    const invoice = this;
    invoice.total = invoice.items.reduce((acc, item) => acc + (item.total), 0);

    next();
});
// Middleware pour recalculer le total lors des mises à jour
InvoiceSchema.pre('findOneAndUpdate', function(next) {
    const items = this._update.items;
    if (items) {
        const total = items.reduce((acc, item) => acc + item.total, 0);
        this._update.total = total;
    }
    next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
