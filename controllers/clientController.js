const ErrorResponse = require('../utils/errorResponse.js');
const asyncHandler = require('../middleware/async.js');
const Client = require('../models/clientModel.js');

// @desc   Obtenir tous les clients
// @route  GET /api/clients
// @access Public
exports.getClients = asyncHandler(async (req, res, next) => {
    let query;

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Client.countDocuments();

    query = Client.find().skip(startIndex).limit(limit);

    // Exécution de la requête
    const clients = await query;

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

    res.status(200).json({ success: true, count: clients.length, pagination, data: clients });
});

// @desc   Obtenir un seul client par ID
// @route  GET /api/clients/:id
// @access Public
exports.getClient = asyncHandler(async (req, res, next) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        return next(new ErrorResponse(`Client non trouvé avec l'ID ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: client });
});

// @desc   Créer un nouveau client
// @route  POST /api/clients
// @access Private
exports.createClient = asyncHandler(async (req, res, next) => {
    const client = await Client.create(req.body);
    res.status(201).json({ success: true, data: client });
});

// @desc   Mettre à jour un client
// @route  PUT /api/clients/:id
// @access Private
exports.updateClient = asyncHandler(async (req, res, next) => {
    let client = await Client.findById(req.params.id);

    if (!client) {
        return next(new ErrorResponse(`Client non trouvé avec l'ID ${req.params.id}`, 404));
    }

    client = await Client.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({ success: true, data: client });
});

// @desc   Supprimer un client
// @route  DELETE /api/clients/:id
// @access Private
exports.deleteClient = asyncHandler(async (req, res, next) => {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
        return next(new ErrorResponse(`Client non trouvé avec l'ID ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: {} });
});
