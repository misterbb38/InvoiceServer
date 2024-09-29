// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const InvoiceItemSchema = new Schema({
//     ref: { type: String, required: [true, 'La référence est obligatoire'] },
//     description: { type: String, required: [true, 'La description est obligatoire'] },
//     category: { 
//         type: String, 
//         enum: ['Traduction', 'Révision'], 
//         required: [true, 'La catégorie est obligatoire'] 
//     },
//     quantity: { type: Number, required: [true, 'La quantité est obligatoire'], min: [0, 'La quantité ne peut pas être négative'] },
//     price: { type: Number, required: [true, 'Le prix est obligatoire'], min: [0, 'Le prix ne peut pas être négatif'] },
//     total: { type: Number, required: [true, 'Le total est obligatoire'] }
// });

// const InvoiceSchema = new Schema({
//     user: {
//         type: Schema.Types.ObjectId,
//         ref: 'User',
//         required: [true, 'L\'utilisateur est obligatoire']
//     },
//     Client: {
//         type: Schema.Types.ObjectId,
//         ref: 'Client',
//         required: false // Le client n'est pas obligatoire si les infos sont directement fournies
//     },
//     client: {
//         name: { type: String, required: [true, 'Le nom du client est obligatoire'] },
//         address: { type: String, required: [true, 'L\'adresse du client est obligatoire'] },
//         email: { type: String },
//         telephone: { type: String, required: [true, 'Le numéro du client est obligatoire'] },
//     },
//     items: [InvoiceItemSchema],
//     invoiceNumber: { type: Number, required: [true, 'Le numéro de facture est obligatoire'] },
//     date: { type: Date, default: Date.now },
//     total: { type: Number, required: true },
//     type: { type: String, enum: ['devis', 'facture'], required: [true, 'Le type de document est obligatoire'] },
//     status: { type: String, enum: [ 'Attente', 'Payée', 'Annullée', 'Attente', 'Payée', 'Annullée'], default: 'Attente' },
//     currency: { 
//         type: String, 
//         enum: ['dollar', 'euro', 'CFA'], 
//         required: [true, 'La devise est obligatoire'], 
//         default: 'CFA'
//     }
// }, { timestamps: true });

// // Middleware pour calculer le total de la facture avant de sauvegarder
// InvoiceSchema.pre('save', function(next) {
//     // Calcul du total en additionnant les totaux des items
//     const invoice = this;
//     invoice.total = invoice.items.reduce((acc, item) => acc + (item.total), 0);

//     next();
// });
// // Middleware pour recalculer le total lors des mises à jour
// InvoiceSchema.pre('findOneAndUpdate', function(next) {
//     const items = this._update.items;
//     if (items) {
//         const total = items.reduce((acc, item) => acc + item.total, 0);
//         this._update.total = total;
//     }
//     next();
// });

// module.exports = mongoose.model('Invoice', InvoiceSchema);


const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceItemSchema = new Schema({
    ref: { type: String, required: [true, 'La référence est obligatoire'] },
    description: { type: String, required: [true, 'La description est obligatoire'] },
    category: { 
        type: String, 
        enum: ['Traduction', 'Révision'], 
        required: false 
    },
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
    status: { type: String, enum: [ 'Attente', 'Payée', 'Annullée'], default: 'Attente' },
    currency: { 
        type: String, 
        enum: ['dollar', 'euro', 'CFA'], 
        required: [true, 'La devise est obligatoire'], 
        default: 'CFA'
    },
    conversion: { type: Number } // Champ pour la valeur en CFA
}, { timestamps: true });

// Middleware pour calculer le total et la conversion avant de sauvegarder
InvoiceSchema.pre('save', function(next) {
    const invoice = this;

    // Calcul du total en additionnant les totaux des items
    invoice.total = invoice.items.reduce((acc, item) => acc + item.total, 0);

    // Calcul de la conversion en CFA si la devise est dollar ou euro
    if (invoice.currency !== 'CFA') {
        let exchangeRate = 1; // Taux de change par défaut pour CFA

        if (invoice.currency === 'euro') {
            exchangeRate = 655.957; // Taux de change fixe entre euro et CFA
        } else if (invoice.currency === 'dollar') {
            exchangeRate = 550; // Taux de change approximatif dollar vers CFA
        }

        invoice.conversion = invoice.total * exchangeRate;
    } else {
        invoice.conversion = invoice.total; // Si la devise est CFA, la conversion est égale au total
    }

    next();
});

// Middleware pour recalculer le total et la conversion lors des mises à jour
InvoiceSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();

    if (update.items) {
        const total = update.items.reduce((acc, item) => acc + item.total, 0);
        update.total = total;

        // Calcul de la conversion en CFA si la devise est dollar ou euro
        if (update.currency && update.currency !== 'CFA') {
            let exchangeRate = 1;

            if (update.currency === 'euro') {
                exchangeRate = 655;
            } else if (update.currency === 'dollar') {
                exchangeRate = 600;
            }

            update.conversion = update.total * exchangeRate;
        } else {
            update.conversion = update.total;
        }
    }

    next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
