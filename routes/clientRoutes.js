const express = require('express');
const {
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient
} = require('../controllers/clientController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes pour les clients
router.route('/')
    .get(  protect, getClients)        // Obtenir tous les clients
    .post(  protect, createClient);    // Créer un nouveau client

router.route('/:id')
    .get(  protect, getClient)         // Obtenir un client spécifique par ID
    .put(  protect, updateClient)     // Mettre à jour un client spécifique par ID
    .delete(  protect, deleteClient);  // Supprimer un client spécifique par ID

module.exports = router;
