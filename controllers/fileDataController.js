// // controllers/fileDataController.js
// const FileData = require('../models/FileDataModel.js')

// exports.saveFileData = async (req, res) => {
//   try {
//     const { fileData } = req.body

//     // Enregistrer tout le tableau de données dans la base de données
//     const savedData = await FileData.create({ fileData })

//     res.status(201).json({
//       status: 'success',
//       message: 'Tableau de données enregistré avec succès',
//       data: savedData,
//     })
//   } catch (error) {
//     res.status(500).json({
//       status: 'error',
//       message: 'Erreur lors de l’enregistrement du tableau de données',
//     })
//   }
// }


const FileData = require('../models/FileDataModel.js');

// Enregistrer tout le tableau de données dans la base de données
exports.saveFileData = async (req, res) => {
  try {
    const { projectName, fileData } = req.body;

    // Calcul des totaux
    const totalWordCount = fileData.reduce((acc, file) => acc + file.wordCount, 0);
    const totalPageCount = fileData.reduce((acc, file) => acc + file.pageCount, 0);
    const totalPriceForWords = fileData.reduce((acc, file) => acc + file.priceForWords, 0);
    const totalPriceForPages = fileData.reduce((acc, file) => acc + file.priceForPages, 0);

    // Créer le document avec les champs supplémentaires
    const savedData = await FileData.create({
      projectName,
      totalWordCount,
      totalPageCount,
      totalPriceForWords,
      totalPriceForPages,
      fileData,
    });

    res.status(201).json({
      status: 'success',
      message: 'Tableau de données enregistré avec succès',
      data: savedData,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l’enregistrement du tableau de données',
      error: error.message,
    });
  }
};

// Récupérer toutes les données de fichiers
exports.getAllFileData = async (req, res) => {
  try {
    const allFileData = await FileData.find();
    res.status(200).json({
      status: 'success',
      message: 'Toutes les données de fichiers récupérées avec succès',
      data: allFileData,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des données de fichiers',
      error: error.message,
    });
  }
};

// Récupérer un fichier par son ID
exports.getFileDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const fileData = await FileData.findById(id);

    if (!fileData) {
      return res.status(404).json({
        status: 'error',
        message: 'Données de fichier non trouvées',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Données de fichier récupérées avec succès',
      data: fileData,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la récupération des données de fichier',
      error: error.message,
    });
  }
};

// Mettre à jour un fichier par son ID
exports.updateFileData = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFileData = await FileData.findByIdAndUpdate(id, req.body, {
      new: true, // Retourner les nouvelles données après mise à jour
      runValidators: true, // Vérifier les validations du modèle
    });

    if (!updatedFileData) {
      return res.status(404).json({
        status: 'error',
        message: 'Données de fichier non trouvées pour mise à jour',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Données de fichier mises à jour avec succès',
      data: updatedFileData,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la mise à jour des données de fichier',
      error: error.message,
    });
  }
};

// Supprimer un fichier par son ID
exports.deleteFileData = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFileData = await FileData.findByIdAndDelete(id);

    if (!deletedFileData) {
      return res.status(404).json({
        status: 'error',
        message: 'Données de fichier non trouvées pour suppression',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Données de fichier supprimées avec succès',
      data: deletedFileData,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur lors de la suppression des données de fichier',
      error: error.message,
    });
  }
};
