const express = require('express');
const {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceStats,
    getFilteredInvoiceStats, // Assurez-vous que cette fonction est définie dans votre contrôleur
    getInvoicesSummaryByClient,
    getClientMonthlyInvoiceStats
} = require('../controllers/invoiceController');

const router = express.Router();



// Routes pour les factures
router.route('/')
    .get(getInvoices)       // Obtenir toutes les factures
    .post(createInvoice);   // Créer une nouvelle facture

// Route pour obtenir les statistiques globales
router.get('/stats', getInvoiceStats);

// Route pour obtenir les statistiques filtrées
router.get('/FilteredStats', getFilteredInvoiceStats); // Utilisation de la bonne fonction
router.get('/summaryclient',getInvoicesSummaryByClient);
router.get('/clientMonthlyInvoiceStats',getClientMonthlyInvoiceStats);

router.route('/:id')
    .get(getInvoice)        // Obtenir une facture spécifique par ID
    .put(updateInvoice)    // Mettre à jour une facture spécifique par ID
    .delete(deleteInvoice); // Supprimer une facture spécifique par ID

module.exports = router;
