var express = require("express"),
    router = express.Router();

module.exports = function() {
    "use strict";

    router.get('/*', function(req, res, next) {
        var protocol = 'http' + (req.connection.encrypted ? 's' : '') + '://',
            host = req.headers.host,
            href;

        // no www. present, nothing to do here
        if (!/^www\./i.test(host)) {
            next();
            return;
        }

        // remove www.
        host = host.replace(/^www\./i, '');
        href = protocol + host + req.url;
        res.statusCode = 301;
        res.setHeader('Location', href);
        res.write('Redirecting to ' + host + req.url + '');
        res.end();
    });

    router.get('/', function(req, res) {
        res.render('index', {
            title: "Home",
            header: "Welkom!",
            readFile: req.session.file,
            message: req.flash(),
            user: req.user
        });
    });

    return router;
};