const paydunya = require('paydunya');

// Configuration de PayDunya
const setup = new paydunya.Setup({
  masterKey: process.env.PAYDUNYA_MASTER_KEY,
  privateKey: process.env.PAYDUNYA_PRIVATE_KEY,
  publicKey: process.env.PAYDUNYA_PUBLIC_KEY,
  token: process.env.PAYDUNYA_TOKEN,
  mode: 'test' // Changez en 'live' pour la production
});

const store = new paydunya.Store({
  name: "Magasin Chez Sandra",
  tagline: "L'élégance n'a pas de prix",
  phoneNumber: '336530583',
  postalAddress: 'Dakar Plateau - Etablissement kheweul',
  logoURL: 'http://www.chez-sandra.sn/logo.png'
});

module.exports = { setup, store };
