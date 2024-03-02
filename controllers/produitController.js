const readExcel = require('read-excel-file/node');
const Produit = require('../models/ProduitModel'); // Assurez-vous que ce chemin est correct
const asyncHandler = require('../middleware/async');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });



// Récupérer tous les produits de l'utilisateur
exports.getProduits = asyncHandler(async (req, res) => {
    const produits = await Produit.find({ user: req.user._id });
    res.status(200).json({ success: true, count: produits.length, data: produits });
});

// @desc    Obtenir un seul produit par ID appartenant à l'utilisateur authentifié
// @route   GET /api/clients/:id
// @access  Private
exports.getProduit = asyncHandler(async (req, res, next) => {
    const produit = await Produit.findOne({ _id: req.params.id, user: req.user._id });

    if (!produit) {
        return next(new ErrorResponse(`Client non trouvé avec l'ID ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: produit });
});

// Ajouter un produit
exports.createProduit = asyncHandler(async (req, res) => {
    const { designation, prixUnitaire, reference } = req.body;
    const produit = new Produit({
        user: req.user._id,
        designation,
        prixUnitaire,
        reference,
    });

    const createdProduit = await produit.save();
    res.status(201).json(createdProduit);
});

// Supprimer un produit
exports.deleteProduit = asyncHandler(async (req, res, next) => {
    const produit = await Produit.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!produit) {
        return next(new ErrorResponse(`Client non trouvé avec l'ID ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: {} });
});

// Mettre à jour un produit
exports.updateProduit = asyncHandler(async (req, res) => {
    const produit = await Produit.findById(req.params.id);

    if (!produit) {
        res.status(404);
        throw new Error('Produit non trouvé');
    }

    // Vérifier si l'utilisateur est le propriétaire du produit
    if (produit.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Action non autorisée');
    }

    const updatedProduit = await Produit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: produit })
});

// Middleware pour la route de téléchargement de fichier
exports.uploadProductFile = upload.single('file');

exports.addProductsFromExcel = asyncHandler(async (req, res, next) => {
    if (req.file && req.file.path) {
        const userId = req.user._id; // ID de l'utilisateur authentifié

        // Lire le fichier Excel
        readExcel(req.file.path).then(async (rows) => {
            // Supposer que la première ligne contient les en-têtes
            const headers = rows.shift();

            // Transformer chaque ligne en un objet produit
            const produits = rows.map(row => {
                const produitData = row.reduce((produitObj, col, index) => {
                    produitObj[headers[index]] = col;
                    return produitObj;
                }, {});

                return {
                    user: userId,
                    ...produitData
                };
            });

            // Enregistrer tous les produits dans la base de données
            await Produit.insertMany(produits);

            res.status(201).json({
                success: true,
                message: 'Produits ajoutés avec succès depuis le fichier Excel',
                count: produits.length
            });
        });
    } else {
        throw new Error('Fichier non fourni ou non valide');
    }
});

