var express = require("express"),
    router = express.Router(),
    User = require('../models/user'),
    bCrypt = require('bcrypt-nodejs'),
    crypto = require('crypto'),
    nodemailer = require('nodemailer'),
    async = require('async');

//Configure this to match mail server used
var smtpTransport = nodemailer.createTransport({
    service: "Hotmail",
    auth: {
        user: "Email here",
        pass: "Password here"
    }
});

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
    
    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    //////////////////////////////////////////
    // Viewing user profiles and their info //
    //////////////////////////////////////////
    router.get('/profile', isLoggedIn, function(req, res) {
        var fileModel = req.db.model("File");
        var userFiles;

        fileModel.find( { "user_id": req.user._id }, function(err, files) {
            if (err) res.status(500).send(err);

            for (var i = 0; i < files.length; i++) {
                var curDate, date = new Date(files[i].time_uploaded);

                var day = date.getUTCDate();
                var month = date.getUTCMonth() + 1;
                var year = date.getUTCFullYear();
                var hours = "0" + date.getUTCHours();
                var minutes = "0" + date.getUTCMinutes();
                var seconds = "0" + date.getUTCSeconds();

                curDate = day + "-" + month + "-" + year + " " + hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);

                files[i].timestamp = curDate;
            }
            
            userFiles = files;

            res.render('profile', {
                title: "Profiel",
                header: "Profiel van " + req.user.firstname + " " + req.user.lastname,
                user : req.user, // get the user out of session and pass to template
                readFile: req.session.file,
                userFiles: userFiles,
                messages: req.flash()
            });
        });
    });
    
    router.get("/user/:id", isLoggedIn, function(req, res) {
        var userModel = req.db.model("User"),
            fileModel = req.db.model("File"),
            id = req.params.id;

        userModel.findById(id, function(err, user) {
            if (user.accessFrom.indexOf(req.user.email) > -1) {
                fileModel.find( { "user_id": id }, function(err, files) {
                    for (var i = 0; i < files.length; i++) {
                        var curDate, date = new Date(files[i].time_uploaded);

                        var day = date.getUTCDate();
                        var month = date.getUTCMonth() + 1;
                        var year = date.getUTCFullYear();
                        var hours = "0" + date.getUTCHours();
                        var minutes = "0" + date.getUTCMinutes();
                        var seconds = "0" + date.getUTCSeconds();

                        curDate = day + "-" + month + "-" + year + " " + hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);

                        files[i].timestamp = curDate;
                    }

                    res.render("user", {
                        title: user.firstname + " " + user.lastname,
                        header: "Gebruiker " + user.firstname + " " + user.lastname,
                        resultUser: user,
                        files: files,
                        user: req.user
                    });
                });
            } else {
                req.flash("error", "Je hebt geen toegang tot dit account.");
                res.redirect("/profile/users");
            }
        });
    });

    router.get("/profile/users", isLoggedIn, function(req, res) {
        var userModel = req.db.model("User");

        userModel.find().where("email").in(req.user.accessTo).exec(function(err, users) {
            if (err) res.send(err);
            else {
                res.render("users", {
                    title: "Gebruikers",
                    header: "Gebruikers",
                    user: req.user,
                    users: users,
                    message: req.flash()
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

    //////////////////////////////////////////////////////////////////////////
    // Current user management -- Deleting, updating, password resets, etc. //
    //////////////////////////////////////////////////////////////////////////
    router.get("/verify/:token", function (req, res, next) {
        var token = req.params.token;
        verifyUser(req, token, function(err) {
            if (err) return res.send("Verificatie mislukt");
            res.send("Verificatie gelukt");
        });
    });

    router.get("/resetpassword", function(req,res) {
        res.render("reset-password", {
            user: req.user,
            title: "Verander wachtwoord",
            header: "Verander wachtwoord",
            messages: req.flash()
        });
    });

    router.get("/reset/:token", function(req,res) {
        User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: {
                $gt: Date.now()
            }
        }, function(err, user) {
            if (!user) {
                req.flash('warning', 'Deze code voor het aanpassen van je wachtwoord bestaat niet of is verlopen.')
                return res.redirect('/resetpassword')
            }
            res.render('reset', {
                title: 'Wachtwoord aanpassen - bevestiging',
                user: req.user,         // Using req.user separately from the user object. User is used to determine if you're logged in, which would always seem to be the case if we used user there.
                resetUser: user,            // Use the user object from the search above to actually pass the user's data to the page.
                header: 'Wachtwoord bevestigen'
            });
        });
    });

    router.post('/resetpassword', function(req, res) {
        async.waterfall([
            function(done) {
                crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                })
            },
            function(token, done) {
                User.findOne({
                    email: req.body.email
                }, function(err, user) {
                    if (!user) {
                        req.flash('warning', 'Er bestaat geen account met dat e-mailadres.');
                        return res.redirect('/resetpassword');
                    }
                    
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                    req.user = user;

                    user.save(function(err) {
                        done(err, token, user);
                    });
                });
            },
            function(token, user, done) {
                var mailOptions = {
                    to: user.email,
                    from: 'Diabetesteam Haga <Optional email here>',
                    subject: 'Aanpassen wachtwoord hagadiabetes.nl',
                    text: 'Je ontvangt deze mail omdat jij (of iemand anders) een verzoek heeft gedaan om je wachtwoord aan te passen.\nKlik op onderstaande link, of plak hem in je browser om het proces te voltooien:\n\nhttp://' + req.headers.host + '/reset/' + token + '\n\nAls je niet om een reset van je wachtwoord hebt gevraagd, negeer deze mail dan. Je wachtwoord zal dan niet veranderen.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('info', 'Er is een e-mail verstuurd naar ' + user.email +
                        ' met verdere instructies. Je kunt dit tabblad nu sluiten.');
                    done(err, 'done');
                });
            }
        ], function(err) {
            if (err) {
                console.log(err);
                req.flash('error', 'Er is iets fout gegaan bij het verwerken van dit formulier.');
            }
            res.redirect('/resetpassword');
        })
    })

    router.post('/reset/:token', function(req, res) {
        async.waterfall([
            function(done) {
                User.findOne({
                    resetPasswordToken: req.params.token,
                    resetPasswordExpires: {
                        $gt: Date.now()
                    }
                }, function(err, user) {
                    if (!user) {
                        req.flash('error', 'De code voor het aanpassen van je wachtwoord is ongeldig of verlopen.');
                        return res.redirect('back');
                    }

                    user.password = createHash(req.body.password);
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    user.save(function(err) {
                        req.logIn(user, function(err) {
                            done(err, user)
                        });
                    });
                });
            },
            function(user, done) {
                var mailOptions = {
                    to: user.email,
                    from: 'Diabetesteam Haga <Optional email here>',
                    subject: 'Je wachtwoord is aangepast',
                    text: 'Hallo,\n\n' +
                        'Dit is een bevestiging dat het wachtwoord voor je account bij hagadiabetes.nl met mailadres ' + user.email +
                        ' zojuist is veranderd.\n'
                };
                smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('success', 'Succes! Je wachtwoord is veranderd en je bent ingelogd.')
                    done(err)
                });
            }
        ], function(err) {
            res.redirect('/profile')
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
};

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else {
        req.flash('error', 'Je moet ingelogd zijn om dit te doen.');
        res.redirect('/login');
    }
}

function verifyUser(req, token, done) {
    var userModel = req.db.model('User');

    userModel.findOne({ token: token }, function (err, user) {
        if (err) return done(err);
        user.verified = true;
        user.save(function(err) {
            done(err);
        });
    });
}

// Generates hash using bCrypt
var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};