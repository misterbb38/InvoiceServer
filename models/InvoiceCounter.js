// models/InvoiceCounter.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InvoiceCounterSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    lastInvoiceNumber: { type: Number, default: 0 }
});

module.exports = mongoose.model('InvoiceCounter', InvoiceCounterSchema);
