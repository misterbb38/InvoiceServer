const express = require('express');
const {
    getProduits,
    createProduit,
    deleteProduit,
    updateProduit,
    getProduit,
    uploadProductFile,
    addProductsFromExcel
} = require('../controllers/produitController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes pour '/api/produits' ou un préfixe similaire défini dans le fichier principal de l'application
router.post('/upload', protect, uploadProductFile, addProductsFromExcel);
router.route('/')
    .get(protect, getProduits) // Obtient tous les produits, nécessite une authentification
    .post(protect, createProduit); // Crée un nouveau produit, nécessite une authentification

router.route('/:id') // Utilise l'ID du produit pour les opérations CRUD spécifiques
    .get(protect, getProduit) // Obtient un produit spécifique par son ID, nécessite une authentification
    .delete(protect, deleteProduit) // Supprime un produit spécifique par son ID, nécessite une authentification
    .put(protect, updateProduit); // Met à jour un produit spécifique par son ID, nécessite une authentification

module.exports = router;
