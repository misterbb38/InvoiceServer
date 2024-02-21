const paydunya = require('paydunya');
const { setup, store } = require('../config/paydunyaConfig');

exports.createPayment = async (req, res) => {
    let invoice = new paydunya.CheckoutInvoice(setup, store);

    // Configuration de la facture (ajouter des articles, etc.)
    invoice.addItem("Ordinateur Lenovo L440", 1, 400000, 400000);
    invoice.totalAmount = 400000;

    invoice.create()
        .then(() => {
            // Si la création de la facture réussit, renvoie l'URL de paiement en JSON
            res.json({ url: invoice.url });
        })
        .catch(e => {
            console.log(e);
            res.status(500).json({ error: "Erreur lors de la création de la facture" });
        });
};
