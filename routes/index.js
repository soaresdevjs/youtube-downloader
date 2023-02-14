const express = require("express");
const router = express.Router();

require('./video')(router);
require('./audio')(router);

router.get('/politica-de-privacidade', (req, res) => {
    res.render('privacidade')
})

router.get('/termos-de-uso', (req, res) => {
    res.render('termos')
})

router.get('/sobre', (req, res) => {
    res.render('sobre')
})

router.get('/contato', (req, res) => {
    res.render('contato')
})

router.get('/faq', (req, res) => {
    res.render('faq')
})

module.exports = router;