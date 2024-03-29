const ErrorResponse = require('../utils/errorResponse.js')
const asyncHandler = require('../middleware/async.js')
const Invoice = require('../models/invoiceModel.js')
const multer = require('multer');
const readExcel = require('read-excel-file/node');
const mongoose = require('mongoose');
const InvoiceCounter = require('../models/InvoiceCounter');


// Configuration de Multer pour le téléchargement de fichiers Excel
const upload = multer({ dest: 'uploads/' });

// Middleware pour la route de téléchargement de fichier
exports.uploadInvoiceFile = upload.single('file');


exports.getInvoices = asyncHandler(async (req, res, next) => {

    // Sans pagination, on récupère simplement toutes les factures
    const invoices = await Invoice.find({ user: req.user._id });

    // On renvoie les factures récupérées
    res.status(200).json({ success: true, count: invoices.length, data: invoices });

});

// @desc   Obtenir une seule facture par ID
// @route  GET /api/invoices/:id
// @access Public


exports.getInvoice = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });

    if (!invoice) {
        return next(new ErrorResponse(`Facture non trouvée avec l'ID ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: invoice });
});

// @desc   Créer une nouvelle facture
// @route  POST /api/invoices
// @access Private


// exports.createInvoice = asyncHandler(async (req, res, next) => {
//     const invoice = await Invoice.create({ ...req.body, user: req.user._id });
//     res.status(201).json({ success: true, data: invoice });
// });

exports.createInvoice = asyncHandler(async (req, res, next) => {
    // Rechercher le compteur de facture pour cet utilisateur ou le créer s'il n'existe pas
    const invoiceCounter = await InvoiceCounter.findOneAndUpdate(
        { user: req.user._id },
        { $inc: { lastInvoiceNumber: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Créer la facture avec le numéro de facture incrémenté
    const invoiceNumber = invoiceCounter.lastInvoiceNumber;
    const invoiceData = { ...req.body, user: req.user._id, invoiceNumber };
    const invoice = await Invoice.create(invoiceData);

    res.status(201).json({ success: true, data: invoice });
});

// @desc   Mettre à jour une facture
// @route  PUT /api/invoices/:id
// @access Private
exports.updateInvoice = asyncHandler(async (req, res, next) => {
    // Trouver la facture appartenant à l'utilisateur authentifié
    let invoice = await Invoice.findOne({ _id: req.params.id, user: req.user._id });

    if (!invoice) {
        return next(new ErrorResponse(`Facture non trouvée avec l'ID ${req.params.id}`, 404));
    }

    // Mise à jour de la facture trouvée
    invoice = await Invoice.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id }, // Assurez-vous que la facture appartient à l'utilisateur
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: invoice });
});



// @desc   Supprimer une facture
// @route  DELETE /api/invoices/:id
// @access Private
// exports.deleteInvoice = asyncHandler(async (req, res, next) => {
//     const invoice = await Invoice.findByIdAndDelete(req.params.id);

//     if (!invoice) {
//         return next(new ErrorResponse(`Facture non trouvée avec l'ID ${req.params.id}`, 404));
//     }

//     res.status(200).json({ success: true, data: {} });
// });

exports.deleteInvoice = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!invoice) {
        return next(new ErrorResponse(`Facture non trouvée avec l'ID ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: {} });
});



// @desc   Obtenir des statistiques sur les factures
// @route  GET /api/invoices/stats
// @access Public
exports.getInvoiceStats = asyncHandler(async (req, res, next) => {
    const { year } = req.query; // Récupérer l'année à partir des paramètres de requête, si fournie
    const userId = req.user._id; // Assurez-vous que votre middleware d'authentification définit `req.user`

    let pipeline = [
        {
            // Filtre pour inclure uniquement les factures de l'utilisateur authentifié et de type "facture"
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                type: "facture" // Ajouter ce filtre pour spécifier le type
            }
        }
    ];

    // Conditionnellement ajouter un filtre $match pour l'année si elle est fournie
    if (year) {
        const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
        pipeline.push({
            $match: {
                date: { $gte: startDate, $lte: endDate }
            }
        });
    }

    // Continuer avec les autres étapes de l'agrégation
    pipeline = pipeline.concat([
        {
            $addFields: {
                "year": { $year: "$date" }
            }
        },
        {
            $group: {
                _id: { status: "$status", year: "$year" },
                totalAmount: { $sum: "$total" },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { "_id.year": 1, "_id.status": 1 }
        }
    ]);

    // Exécuter le pipeline d'agrégation
    try {
        const stats = await Invoice.aggregate(pipeline);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error("Erreur lors de l'agrégation des statistiques des factures :", error);
        res.status(500).json({ success: false, message: "Erreur interne du serveur lors de la récupération des statistiques des factures." });
    }
});




// @desc   Obtenir des statistiques sur les factures filtrées par période
// @route  GET /api/invoices/stats/filtered
// @access Public
// exports.getFilteredInvoiceStats = asyncHandler(async (req, res, next) => {
//     // Récupérer l'année à partir de la requête, utiliser l'année courante par défaut
//     const year = parseInt(req.query.year) || new Date().getFullYear();

//     const summary = await Invoice.aggregate([
//         {
//             $project: {
//                 month: { $month: "$date" },
//                 year: { $year: "$date" },
//                 status: 1,
//                 total: 1
//             }
//         },
//         {
//             $match: {
//                 year: year // Filtrer dynamiquement par année
//             }
//         },
//         {
//             $group: {
//                 _id: { month: "$month", status: "$status" },
//                 totalAmount: { $sum: "$total" },
//                 count: { $sum: 1 }
//             }
//         },
//         {
//             $sort: { "_id.month": 1 }
//         }
//     ]);

//     // Initialiser les résultats pour chaque statut avec des montants à 0 pour chaque mois
//     let results = {
//         Payée: Array(12).fill(null).map(() => ({ totalAmount: 0, count: 0 })),
//         Attente: Array(12).fill(null).map(() => ({ totalAmount: 0, count: 0 })),
//         Annullée: Array(12).fill(null).map(() => ({ totalAmount: 0, count: 0 }))
//     };

//     // Remplir les résultats avec les données réelles
//     summary.forEach(item => {
//         const { month, status } = item._id;
//         // Assurez-vous que le statut existe dans les résultats pour éviter des erreurs
//         if (results[status]) {
//             results[status][month - 1] = { totalAmount: item.totalAmount, count: item.count };
//         }
//     });

//     res.status(200).json({ success: true, data: results });
// });

exports.getFilteredInvoiceStats = asyncHandler(async (req, res, next) => {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const userId = req.user._id; // Assurez-vous que votre middleware d'authentification définit `req.user`

    const summary = await Invoice.aggregate([
        {
            // Premièrement, filtrer les factures par utilisateur authentifié
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                // Ajouter ce filtre pour spécifier le type
                type: "facture"
            }
        },
        {
            $project: {
                month: { $month: "$date" },
                year: { $year: "$date" },
                status: 1,
                total: 1
            }
        },
        {
            // Ensuite, filtrer dynamiquement par année si spécifié
            $match: {
                year: year
            }
        },
        {
            $group: {
                _id: { month: "$month", status: "$status" },
                totalAmount: { $sum: "$total" },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { "_id.month": 1 }
        }
    ]);

    // Initialiser et remplir les résultats comme avant
    let results = {
        Payée: Array(12).fill(null).map(() => ({ totalAmount: 0, count: 0 })),
        Attente: Array(12).fill(null).map(() => ({ totalAmount: 0, count: 0 })),
        Annullée: Array(12).fill(null).map(() => ({ totalAmount: 0, count: 0 }))
    };

    summary.forEach(item => {
        const { month, status } = item._id;
        if (results[status]) {
            results[status][month - 1] = { totalAmount: item.totalAmount, count: item.count };
        }
    });

    res.status(200).json({ success: true, data: results });
});




// @desc   Obtenir les factures regroupées par client avec total et compte par état
// @route  GET /api/invoices/summary-by-client
// @access Public
// exports.getInvoicesSummaryByClient = asyncHandler(async (req, res, next) => {
//     const { year } = req.query; // Récupérer l'année à partir des paramètres de requête

//     let matchStage = {};
//     if (year) {
//         const yearInt = parseInt(year, 10);
//         const startDate = new Date(yearInt, 0, 1);
//         const endDate = new Date(yearInt + 1, 0, 1);
//         matchStage = { $match: { date: { $gte: startDate, $lt: endDate } } };
//     }

//     const aggregateQuery = [
//         matchStage,
//         {
//             $group: {
//                 _id: "$client",
//                 totalAmountPayée: { $sum: { $cond: [{ $eq: ["$status", "Payée"] }, "$total", 0] } },
//                 totalAmountAttente: { $sum: { $cond: [{ $eq: ["$status", "Attente"] }, "$total", 0] } },
//                 totalAmountAnnullée: { $sum: { $cond: [{ $eq: ["$status", "Annullée"] }, "$total", 0] } },
//                 countPayée: { $sum: { $cond: [{ $eq: ["$status", "Payée"] }, 1, 0] } },
//                 countAttente: { $sum: { $cond: [{ $eq: ["$status", "Attente"] }, 1, 0] } },
//                 countAnnullée: { $sum: { $cond: [{ $eq: ["$status", "Annullée"] }, 1, 0] } }
//             }
//         },
//         {
//             $project: {
//                 _id: 0,
//                 client: "$_id",
//                 totalAmountPayée: 1,
//                 totalAmountAttente: 1,
//                 totalAmountAnnullée: 1,
//                 countPayée: 1,
//                 countAttente: 1,
//                 countAnnullée: 1
//             }
//         }
//     ].filter(stage => Object.keys(stage).length > 0); // Filtrer les étapes vides

//     const clientSummary = await Invoice.aggregate(aggregateQuery);

//     res.status(200).json({ success: true, data: clientSummary });
// });

exports.getInvoicesSummaryByClient = asyncHandler(async (req, res, next) => {
    const { year } = req.query; // Récupérer l'année à partir des paramètres de requête
    const userId = req.user._id; // Assurez-vous que votre middleware d'authentification définit `req.user`

    let matchStages = [
        {
            // Premier filtre pour restreindre aux factures de l'utilisateur
            $match: {
                user: new mongoose.Types.ObjectId(userId),
                type: "facture"
            }
        }
    ];

    if (year) {
        const yearInt = parseInt(year, 10);
        const startDate = new Date(yearInt, 0, 1);
        const endDate = new Date(yearInt + 1, 0, 1);
        matchStages.push({ $match: { date: { $gte: startDate, $lt: endDate } } });
    }

    const aggregateQuery = [
        ...matchStages,
        {
            $group: {
                _id: "$client",
                totalAmountPayée: { $sum: { $cond: [{ $eq: ["$status", "Payée"] }, "$total", 0] } },
                totalAmountAttente: { $sum: { $cond: [{ $eq: ["$status", "Attente"] }, "$total", 0] } },
                totalAmountAnnullée: { $sum: { $cond: [{ $eq: ["$status", "Annullée"] }, "$total", 0] } },
                countPayée: { $sum: { $cond: [{ $eq: ["$status", "Payée"] }, 1, 0] } },
                countAttente: { $sum: { $cond: [{ $eq: ["$status", "Attente"] }, 1, 0] } },
                countAnnullée: { $sum: { $cond: [{ $eq: ["$status", "Annullée"] }, 1, 0] } }
            }
        },
        {
            $project: {
                _id: 0,
                client: "$_id",
                totalAmountPayée: 1,
                totalAmountAttente: 1,
                totalAmountAnnullée: 1,
                countPayée: 1,
                countAttente: 1,
                countAnnullée: 1
            }
        }
    ];

    const clientSummary = await Invoice.aggregate(aggregateQuery);

    res.status(200).json({ success: true, data: clientSummary });
});




////

// exports.getClientMonthlyInvoiceStats = asyncHandler(async (req, res) => {
//     const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();

//     const summary = await Invoice.aggregate([
//         {
//             $project: {
//                 client: 1,
//                 month: { $month: "$date" },
//                 year: { $year: "$date" },
//                 status: 1,
//                 total: 1
//             }
//         },
//         {
//             $match: { year }
//         },
//         {
//             $group: {
//                 _id: { client: "$client", month: "$month", status: "$status" },
//                 totalAmount: { $sum: "$total" },
//                 count: { $sum: 1 }
//             }
//         },
//         {
//             $sort: { "_id.client": 1, "_id.month": 1 }
//         }
//     ]);

//     // Transformer les données en une structure plus facile à utiliser côté client
//     let results = {};
//     summary.forEach(({ _id, totalAmount, count }) => {
//         const { client, month, status } = _id;
//         if (!results[client.name]) {
//             results[client.name] = Array.from({ length: 12 }, () => ({
//                 Payée: { count: 0, totalAmount: 0 },
//                 Attente: { count: 0, totalAmount: 0 },
//                 Annullée: { count: 0, totalAmount: 0 }
//             }));
//         }
//         if (results[client.name][month - 1][status]) {
//             results[client.name][month - 1][status] = { count, totalAmount };
//         }
//     });

//     res.json({ success: true, data: results });
// });

exports.getClientMonthlyInvoiceStats = asyncHandler(async (req, res) => {
    const year = req.query.year ? parseInt(req.query.year, 10) : new Date().getFullYear();
    const userId = req.user._id; // Assurez-vous que votre middleware d'authentification définit `req.user`

    const summary = await Invoice.aggregate([
        {
            // Ajouter un filtre pour ne sélectionner que les factures appartenant à l'utilisateur
            $match: {
                user: new mongoose.Types.ObjectId(userId), // Assurez-vous que le champ 'user' existe sur vos documents de facture et est correctement lié aux utilisateurs
                type: "facture"
            }
        },
        {
            $project: {
                client: 1,
                month: { $month: "$date" },
                year: { $year: "$date" },
                status: 1,
                total: 1
            }
        },
        {
            $match: {
                year: year // Filtrer dynamiquement par année
            }
        },
        {
            $group: {
                _id: { client: "$client", month: "$month", status: "$status" },
                totalAmount: { $sum: "$total" },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { "_id.client": 1, "_id.month": 1 }
        }
    ]);

    // Transformer les données en une structure plus facile à utiliser côté client
    let results = {};
    summary.forEach(({ _id, totalAmount, count }) => {
        const { client, month, status } = _id;
        if (!results[client.name]) {
            results[client.name] = Array.from({ length: 12 }, () => ({
                Payée: { count: 0, totalAmount: 0 },
                Attente: { count: 0, totalAmount: 0 },
                Annullée: { count: 0, totalAmount: 0 }
            }));
        }
        if (results[client.name][month - 1][status]) {
            results[client.name][month - 1][status] = { count, totalAmount };
        }
    });

    res.json({ success: true, data: results });
});




// exports.addInvoicesFromExcel = asyncHandler( async (req, res, next) => {

//       if (req.file && req.file.path) {
//         // Lire le fichier Excel
//         readExcel(req.file.path).then(async (rows) => {
//           // Supposer que la première ligne contient les en-têtes
//           const headers = rows.shift();

//           // Regrouper les lignes par FactureID
//           const groupedByInvoiceId = rows.reduce((acc, row) => {
//             const invoiceData = row.reduce((invoiceObj, col, index) => {
//               invoiceObj[headers[index]] = col;
//               return invoiceObj;
//             }, {});

//             if (!acc[invoiceData.FactureID]) {
//               acc[invoiceData.FactureID] = [];
//             }

//             acc[invoiceData.FactureID].push(invoiceData);
//             return acc;
//           }, {});

//           // Traitement de chaque facture
//           for (const [invoiceId, items] of Object.entries(groupedByInvoiceId)) {
//             const { ClientName, ClientAddress, ClientEmail, ClientTelephone, Date, Type, Status, TotalFacture } = items[0]; // Infos facture basées sur le premier article

//             // Créer l'objet facture sans les articles pour l'instant
//             let invoice = {
//               client: {
//                 name: ClientName,
//                 address: ClientAddress,
//                 email: ClientEmail,
//                 telephone: ClientTelephone,
//               },
//               date: Date,
//               total: TotalFacture,
//               type: Type,
//               status: Status,
//               items: items.map(item => ({ // Transformation des articles
//                 ref: item.Ref,
//                 description: item.Description,
//                 quantity: item.Quantity,
//                 price: item.Price,
//                 total: item.TotalItem,
//               }))
//             };

//             // Insertion de la facture dans la base de données
//             await Invoice.create(invoice);
//           }

//           res.status(201).json({
//             success: true,
//             message: 'Factures ajoutées avec succès depuis le fichier Excel'
//           });
//         });
//       } else {
//         throw new Error('Fichier non fourni ou non valide');
//       }

//   });

exports.addInvoicesFromExcel = asyncHandler(async (req, res, next) => {
    if (req.file && req.file.path) {
        // Assurez-vous que le middleware d'authentification est appliqué à cette route pour avoir accès à req.user
        const userId = req.user._id; // ID de l'utilisateur authentifié

        // Lire le fichier Excel
        readExcel(req.file.path).then(async (rows) => {
            // Supposer que la première ligne contient les en-têtes
            const headers = rows.shift();

            // Regrouper les lignes par FactureID
            const groupedByInvoiceId = rows.reduce((acc, row) => {
                const invoiceData = row.reduce((invoiceObj, col, index) => {
                    invoiceObj[headers[index]] = col;
                    return invoiceObj;
                }, {});

                if (!acc[invoiceData.FactureID]) {
                    acc[invoiceData.FactureID] = [];
                }

                acc[invoiceData.FactureID].push(invoiceData);
                return acc;
            }, {});

            // Traitement de chaque facture
            for (const [invoiceId, items] of Object.entries(groupedByInvoiceId)) {
                const { ClientName, ClientAddress, ClientEmail, ClientTelephone, Date, Type, Status, TotalFacture } = items[0]; // Infos facture basées sur le premier article

                // Créer l'objet facture sans les articles pour l'instant
                let invoice = {
                    user: userId, // Associer l'utilisateur authentifié à la facture
                    client: {
                        name: ClientName,
                        address: ClientAddress,
                        email: ClientEmail,
                        telephone: ClientTelephone,
                    },
                    date: Date,
                    total: TotalFacture,
                    type: Type,
                    status: Status,
                    items: items.map(item => ({ // Transformation des articles
                        ref: item.Ref,
                        description: item.Description,
                        quantity: item.Quantity,
                        price: item.Price,
                        total: item.TotalItem,
                    }))
                };
                const invoiceCounter = await InvoiceCounter.findOneAndUpdate(
                    { user: userId },
                    { $inc: { lastInvoiceNumber: 1 } },
                    { new: true, upsert: true }
                );

                // Ajouter le numéro de facture incrémenté à l'objet invoice
                invoice.invoiceNumber = invoiceCounter.lastInvoiceNumber;

                // Insertion de la facture dans la base de données
                await Invoice.create(invoice);
            }

            res.status(201).json({
                success: true,
                message: 'Factures ajoutées avec succès depuis le fichier Excel'
            });
        });
    } else {
        throw new Error('Fichier non fourni ou non valide');
    }
});


