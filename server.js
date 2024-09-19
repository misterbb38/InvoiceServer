const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cors = require('cors'); // Importer cors
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
connectDB();

const app = express(); // Initialisation de l'app Express

app.use(cors());
// app.use(cors({
//     origin: 'https://invoice-front-app.onrender.com', // Autoriser seulement cette origine à accéder à l'API
// }));


// Body parser pour lire les données du corps de la requête
app.use(express.json());

// Middleware de logging pour le développement
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
const invoice = require('./routes/invoiceRoutes');
const client = require('./routes/clientRoutes');
const user = require('./routes/userRoutes');
const notification = require('./routes/notificationRoutes');
const produitRoutes = require('./routes/produitRoutes'); // Mettez à jour le chemin selon votre structure de fichiers
//const payment = require('./routes/paymentRoutes');
const fileData = require('./routes/fileDataRoutes')

// Monter les routeurs
app.use('/api/invoice', invoice);
app.use('/api/client', client);
app.use('/api/user', user);
//app.use('/api/payment', payment);
app.use('/api/notification', notification);
app.use('/api/produit', produitRoutes);
app.use('/api/fileData', fileData);
app.use('/uploads', express.static('uploads'));


// Correction pour définir une route racine
app.get('/', function (req, res) {
    return res.status(200).json({ message: 'Welcome to the API' });
});


// Middleware de gestion des erreurs
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Le serveur écoute sur le port ${PORT} et fonctionne en mode ${process.env.NODE_ENV}`.yellow.bold.underline);
});
