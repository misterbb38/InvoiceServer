const express = require('express');
const {
  saveFileData,
  getAllFileData,
  getFileDataById,
  updateFileData,
  deleteFileData,
} = require('../controllers/fileDataController.js');

const router = express.Router();

// Route POST pour enregistrer le tableau complet de données
router.post('/save-file-data', saveFileData);

// Route GET pour récupérer toutes les données de fichiers
router.get('/get-all-file-data', getAllFileData);

// Route GET pour récupérer un fichier par son ID
router.get('/get-file-data/:id', getFileDataById);

// Route PUT pour mettre à jour un fichier par son ID
router.put('/update-file-data/:id', updateFileData);

// Route DELETE pour supprimer un fichier par son ID
router.delete('/delete-file-data/:id', deleteFileData);

module.exports = router;
