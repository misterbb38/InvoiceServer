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
    getClientMonthlyInvoiceStats,
    uploadInvoiceFile, addInvoicesFromExcel 
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();



// Routes pour les factures
router.route('/')
    .get( protect, getInvoices)       // Obtenir toutes les factures
    .post(  protect, createInvoice);   // Créer une nouvelle facture
    
router.post('/upload',  protect, uploadInvoiceFile, addInvoicesFromExcel);

// Route pour obtenir les statistiques globales
router.get('/stats',  protect,  getInvoiceStats);

// Route pour obtenir les statistiques filtrées
router.get('/FilteredStats',  protect,  getFilteredInvoiceStats); // Utilisation de la bonne fonction
router.get('/summaryclient',  protect, getInvoicesSummaryByClient);
router.get('/clientMonthlyInvoiceStats',  protect, getClientMonthlyInvoiceStats);

router.route('/:id')
    .get(  protect, getInvoice)        // Obtenir une facture spécifique par ID
    .put(  protect, updateInvoice)    // Mettre à jour une facture spécifique par ID
    .delete( protect, deleteInvoice); // Supprimer une facture spécifique par ID

module.exports = router;
