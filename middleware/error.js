const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    console.log(err); // Assurez-vous que cette ligne est toujours présente
// Mongo bad ObjectId
    if (err.name === 'CastError') {
        const message = `l'element n'a pas été trouvé avec l'ID ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

// Mongo duplicated error
    if(err.code === 11000){
        const message = `Le bootcamp de ce nom  existe deja}`;
        error = new ErrorResponse(message, 404);
    }

// Mongo validation error
    if(err.name === 'ValidationError'){
        const message = Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message, 400)
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Erreur serveur'
    });
};

module.exports = errorHandler;
