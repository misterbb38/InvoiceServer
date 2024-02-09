const ErrorResponse = require('../utils/errorResponse.js')
const asyncHandler = require('../middleware/async.js')
const Invoice = require('../models/invoiceModel.js')
const mongoose = require('mongoose')


// @desc   Obtenir toutes les factures
// @route  GET /api/invoices
// @access Public
exports.getInvoices = asyncHandler(async (req, res, next) => {
    let query;

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Invoice.countDocuments();

    query = Invoice.find().skip(startIndex).limit(limit);

    // Exécution de la requête
    const invoices = await query;

    // Pagination résultat
    const pagination = {};

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        };
    }

    res.status(200).json({ success: true, count: invoices.length, pagination, data: invoices });
});

// @desc   Obtenir une seule facture par ID
// @route  GET /api/invoices/:id
// @access Public
exports.getInvoice = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findById(req.params.id).populate('Client');

    if (!invoice) {
        return next(new ErrorResponse(`Facture non trouvée avec l'ID ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: invoice });
});

// @desc   Créer une nouvelle facture
// @route  POST /api/invoices
// @access Private
exports.createInvoice = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.create(req.body);
    res.status(201).json({ success: true, data: invoice });
});

// @desc   Mettre à jour une facture
// @route  PUT /api/invoices/:id
// @access Private
exports.updateInvoice = asyncHandler(async (req, res, next) => {
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
        return next(new ErrorResponse(`Facture non trouvée avec l'ID ${req.params.id}`, 404));
    }

    invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: invoice });
});

// @desc   Supprimer une facture
// @route  DELETE /api/invoices/:id
// @access Private
exports.deleteInvoice = asyncHandler(async (req, res, next) => {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
        return next(new ErrorResponse(`Facture non trouvée avec l'ID ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: {} });
});


//////


// @desc   Obtenir des statistiques sur les factures
// @route  GET /api/invoices/stats
// @access Public
exports.getInvoiceStats = asyncHandler(async (req, res, next) => {
    const stats = await Invoice.aggregate([
        // Groupement par statut
        {
            $group: {
                _id: "$status",
                totalAmount: { $sum: "$total" },
                count: { $sum: 1 }
            }
        }
    ]);

    res.status(200).json({ success: true, data: stats });
});


///

// @desc   Obtenir des statistiques sur les factures filtrées par période
// @route  GET /api/invoices/stats/filtered
// @access Public
exports.getFilteredInvoiceStats= asyncHandler(async (req, res, next) => {
    const year = new Date().getFullYear(); // ou une année spécifique

    const summary = await Invoice.aggregate([
        {
            $project: {
                month: { $month: "$date" },
                year: { $year: "$date" },
                status: 1,
                total: 1
            }
        },
        {
            $match: {
                year: year // Filtrer par année si nécessaire
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

    // Initialiser les résultats pour chaque statut avec des montants à 0 pour chaque mois
    let results = {
        paid: Array(12).fill({ totalAmount: 0, count: 0 }),
        pending: Array(12).fill({ totalAmount: 0, count: 0 }),
        cancelled: Array(12).fill({ totalAmount: 0, count: 0 })
    };

    // Remplir les résultats avec les données réelles
    summary.forEach(item => {
        const { month, status } = item._id;
        results[status][month - 1] = { totalAmount: item.totalAmount, count: item.count };
    });

    res.status(200).json({ success: true, data: results });
});


// @desc   Obtenir les factures regroupées par client avec total et compte par état
// @route  GET /api/invoices/summary-by-client
// @access Public
exports.getInvoicesSummaryByClient = asyncHandler(async (req, res, next) => {
    const aggregateQuery = [
        {
            $group: {
                _id: "$client", // Grouper par client
                totalAmountPaid: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "paid"] }, "$total", 0] // Somme des montants pour les factures payées
                    }
                },
                totalAmountPending: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "pending"] }, "$total", 0] // Somme des montants pour les factures en attente
                    }
                },
                totalAmountCancelled: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "cancelled"] }, "$total", 0] // Somme des montants pour les factures annulées
                    }
                },
                countPaid: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "paid"] }, 1, 0] // Nombre de factures payées
                    }
                },
                countPending: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "pending"] }, 1, 0] // Nombre de factures en attente
                    }
                },
                countCancelled: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] // Nombre de factures annulées
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                client: "$_id",
                totalAmountPaid: 1,
                totalAmountPending: 1,
                totalAmountCancelled: 1,
                countPaid: 1,
                countPending: 1,
                countCancelled: 1
            }
        }
    ];

    const clientSummary = await Invoice.aggregate(aggregateQuery);

    res.status(200).json({ success: true, data: clientSummary });
});


////
exports.getClientMonthlyInvoiceStats = asyncHandler(async (req, res, next) => {
    const year = new Date().getFullYear(); // ou une année spécifique

    const summary = await Invoice.aggregate([
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
                year: year // Filtrer par année
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

    // Structurer les données pour chaque client
    let results = {};

    summary.forEach(item => {
        const { client, month, status } = item._id;

        // Initialiser le client s'il n'existe pas déjà
        if (!results[client.name]) {
            results[client.name] = Array(12).fill().map(() => ({
                paid: { totalAmount: 0, count: 0 },
                pending: { totalAmount: 0, count: 0 },
                cancelled: { totalAmount: 0, count: 0 }
            }));
        }

        // Remplir les données pour chaque mois et chaque statut
        results[client.name][month - 1][status] = {
            totalAmount: item.totalAmount,
            count: item.count
        };
    });

    res.status(200).json({ success: true, data: results });
});


