var express = require("express"),
    router = express.Router();

module.exports = function(passport) {
	"use strict";

	/////////////////////////////////////////////////////
	// Authentication routing -- Login, signup, logout //
	/////////////////////////////////////////////////////
    router.get('/login', function(req, res) {
        res.render('login', {
            title: "Login",
            header: "Inloggen",
            message: req.flash(),
            user: req.user
        });
    });

    // process the login form
    router.post('/login', passport.authenticate('login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    router.get('/signup', function(req, res) {
        res.render('signup', {
            title: "Inschrijven",
            header: "Registreren",
            message: req.flash(),
            user: req.user,
            readFile: req.session.file
        });
    });

    // process the signup form
    router.post('/signup', passport.authenticate('signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    router.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile', {
            title: "Profiel",
            header: "Profiel van " + req.user.firstname + " " + req.user.lastname,
            user : req.user, // get the user out of session and pass to template
            readFile: req.session.file,
            messages: req.flash()
        });
    });
    
    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    //////////////////////////////////////////////////////////////////////////
    // Current user management -- Deleting, updating, password resets, etc. //
    //////////////////////////////////////////////////////////////////////////
    router.get("/profile/users", isLoggedIn, function(req, res) {
        var userModel = req.db.model("User");

        userModel.find().where("email").in(req.user.accessTo).exec(function(err, users) {
            if (err) res.send(err);
            else {
                res.render("users", {
                    title: "Gebruikers",
                    header: "Gebruikers",
                    user: req.user,
                    users: users
                });
            }
        });
    });

    router.get("/users/file", isLoggedIn, function(req, res) {
        var userModel = req.db.model("User"),
            email = req.query.email,
            id = req.query.id;

        userModel.findOne({ "email": email }, function(err, users) {
            if (err) res.send(err);
            else {
                for (var i = 0; i < users.uploadedFiles.length; i++) {
                    if (users.uploadedFiles[i]._id === id) {
                        console.log(users.uploadedFiles[i]);
                    }
                }
            }
        });
    });

    router.post("/delete/user/:id", isLoggedIn, function(req, res) {
        // delete a user (by id)
        var model = req.db.model("User"),
            id = req.params.id;

        if (id != req.user._id) {
            req.flash("error", "Je hebt geen toegang tot deze account.");
            res.redirect("../");
        } else {
            model.findByIdAndRemove(id, function(err, user) {
                if (err) {
                    res.send(err);
                } else {
                    req.flash('success', 'Account verwijderd.');
                    res.redirect('/');
                }
            });
        }
    });

    router.post("/authorise/user", isLoggedIn, function(req, res) {
        // authorise a user (by email)
        var userModel = req.db.model("User"),
            id = req.params.id,
            email = req.body.email;

        userModel.update({ _id: req.user._id }, { $push: { accessFrom: email }}, function(err) {
            if (err)
                console.log("Kon e-mail van andere gebruiker niet toegang geven.");
        });

        userModel.update({ "email": email }, { $push: { accessTo: req.user.email }}, function(err, docs) {
            if (err) {
                console.log(err);
                req.flash("warning", "Kon niet toevoegen aan account van andere gebruiker.");
            }
        });

        req.flash("success", "Account gemachtigd");
        res.redirect("/profile");
    });

    router.post("/unauthorise/user", isLoggedIn, function(req, res) {
        // authorise a user (by email)
        var userModel = req.db.model("User"),
            id = req.params.id,
            email = req.body.email;

        userModel.update({ _id: req.user._id }, { $pull: { accessFrom: email }}, function(err) {
            if (err)
                console.log("Kon e-mail van andere gebruiker niet verwijderen.");
        });

        userModel.update({ "email": email }, { $pull: { accessTo: req.user.email }}, function(err, docs) {
            if (err) {
                console.log(err);
                req.flash("warning", "Kon niet verwijderen van account van andere gebruiker.");
            }
        });

        req.flash("success", "Machtiging account opgeheven.");
        res.redirect("/profile");
    });

	return router;
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    req.flash('error', 'Je moet ingelogd zijn om dit te doen.');
    res.redirect('/login');
}