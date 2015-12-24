var express = require("express"),
    omniPod = require('../util/insulet/omnipod'),
    paradigmVeo = require('../util/medtronic/paradigm-veo'),
    us = require('underscore'),
    multer = require('multer'),
    mkdirp = require('mkdirp'),
    parseString = require('xml2js').parseString,
    fs = require('fs'),
    xml2js = require('xml2js'),
    router = express.Router();

var uploading = multer({
    dest: './public/uploads/'
});

module.exports = function() {
	"use strict";
    
	router.get('/fileupload', isLoggedIn, function(req, res) {
        res.render("file-upload", {
            title: "Upload bestand",
            header: "Bestand uploaden",
            readFile: req.session.file,
            messages: req.flash(),
            user: req.user
        });
    });
    
    router.post('/upload', uploading.single('inputFile'), function(req, res) {
        if (typeof req.file === "undefined") {
            req.flash("warning", "Kies een bestand om te uploaden.");
            res.redirect("/fileupload");
        }

        req.session.filename = req.file.originalname;
        req.session.filetype = req.file.mimetype;

        mkdirp(req.file.destination + '\\' + req.user._id, function(err) {
            if (err) console.log(err);
        });

        if (req.file.mimetype === "text/xml") {
            omniPod.prepareFile(req, res);
            res.redirect('/readings');
        } else if (req.file.mimetype === "application/vnd.ms-excel") {
            paradigmVeo.prepareFile(req, res);
            res.redirect('/graph');
        } else {
            req.flash("error", "Dit bestand is van een ongeldig bestandsformaat.");
            res.redirect("/fileupload");
        }
    });

    router.get('/getGraphData', function(req, res){
      res.send(paradigmVeo.getDailyGraphData(req));
    });
    
    router.get('/moregraphs', function(req, res){
        res.render('moreGraphs', {
        title: 'Meer grafieken',
        header: 'Grafieken',
        readFile: req.session.file
      });
    });
    
    ///////////////////////////////////////////////////////////////
    // GET readings, formatted for use in the full-detail modal. //
    ///////////////////////////////////////////////////////////////
    router.get('/reading', fileActive, function(req, res) {
        res.send(omniPod.getReading(req));
    });

    ///////////////////////////////////////////////////////////////////
    // GET table data, to display in page via client-side JS.        //
    // This is for debugging purposes, to be able to print the data. //
    ///////////////////////////////////////////////////////////////////
    router.get('/readingsData', fileActive, function(req, res) {
        res.send(omniPod.getReadings(req));
    });

    router.get("/file/:id", isLoggedIn, function(req, res) {
        var id = req.params.id,
            fileModel = req.db.model("Files");

        fileModel.findById(id, function(err, file) {
            if (err) res.send(err);

            if (file.path.substr(file.path.length-3) === "xml") {
                omniPod.readFile(req, file.path);
                res.redirect("/readings");
            } else if (file.path.substr(file.path.length-3) === "csv") {
                paradigmVeo.readFile(req, file.path);
                res.redirect("/graph");
            } else {
                req.flash("error", "Dit is geen geldig bestandsformaat. Hoe is het sowieso gelukt om dit te uploaden?");
                res.redirect("/profile/users");
            }
        });
    });

    ////////////////////
    // GET table page //
    ////////////////////
    router.get('/readings', fileActive, function(req, res) {
        if (req.session.filetype === 'text/xml') {
            var resultFile = omniPod.getReadings(req);
            
            res.render('readings', {
                title: 'Tabel OmniPod',
                header: 'Tabel',
                readFile: resultFile,
                user: req.user
            });
        }else if(req.session.filetype === 'application/vnd.ms-excel'){
            var result = paradigmVeo.getReadings(req);
            
            res.render('table', {
                title: 'Tabel Paradigm Veo',
                header: 'Tabel',
                readFile: req.session.file,
                data: result,
                user: req.user
            });
        }
    });

    ////////////////////
    // GET graph page //
    ////////////////////
    router.get('/graph', fileActive, function(req, res) {

        if (req.session.filetype === 'text/xml') {
            var items = omniPod.getGraph(req);

            res.render("graph", {
                title: "Grafiek OmniPod",
                header: "Grafiek",
                items: JSON.stringify(items),
                readFile: req.session.file,
                user: req.user
            });
        } else if (req.session.filetype === "application/vnd.ms-excel") {
            // Do we also handle this in a separate file, returning the start and end dates?
            function dateToString (date){
                return date.getUTCDate() + "-" + (date.getUTCMonth()+1) + "-" + date.getUTCFullYear();
            }
            
            res.render('dailyGraph', {
                title: 'Grafiek Paradigm Veo',
                header: 'Grafiek',
                readFile: req.session.file,
                user: req.user,
                startDate: dateToString(new Date(req.session.file[0].date + " UTC+0000")),
                endDate: dateToString(new Date((req.session.file[req.session.file.length-1].date + " UTC+0000")))
            });
        } else {
            req.flash("error", "Dit is een ongeldig bestandsformaat. Hoe is het sowieso gelukt om dit te uploaden?");
            res.redirect("/profile");
        }

    });

	return router;
}

function fileActive(req, res, next) {
    if (typeof req.session.file === 'undefined') {
        req.flash("error", "Lees eerst een bestand in.");
        res.redirect("/fileupload");
    } else {
        next();
    }
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    req.flash('error', 'Je moet ingelogd zijn om dit te doen.');
    res.redirect('/login');
}