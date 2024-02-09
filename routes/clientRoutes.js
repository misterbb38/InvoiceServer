const express = require('express');
const {
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient
} = require('../controllers/clientController');

const router = express.Router();

// Routes pour les clients
router.route('/')
    .get(getClients)        // Obtenir tous les clients
    .post(createClient);    // Créer un nouveau client

router.route('/:id')
    .get(getClient)         // Obtenir un client spécifique par ID
    .put(updateClient)     // Mettre à jour un client spécifique par ID
    .delete(deleteClient);  // Supprimer un client spécifique par ID

module.exports = router;
