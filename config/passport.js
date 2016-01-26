var LocalStrategy = require('passport-local').Strategy,
	User = require('../models/user'),
    nodemailer = require('nodemailer'),
    verificationToken = require('../models/verificationToken');

var smtpTransport = nodemailer.createTransport({
    service: "Hotmail",
    auth: {
        user: "Email here",
        pass: "Password here"
    }
});

module.exports = function(passport) {
	// Serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

	        // find a user whose email is the same as the forms email
	        // we are checking to see if the user trying to login already exists
	        User.findOne({ 'email' :  email }, function(err, user) {
	            // if there are any errors, return the error
	            if (err)
	                return done(err);

	            // check to see if theres already a user with that email
	            if (user) {
	                return done(null, false, req.flash('error', 'Er bestaat al een account met dat e-mailadres.'));
	            } else {

	                // if there is no user with that email
	                // create the user
	                var newUser 		= new User();

                    var verificationTokenModel = req.db.model('verificationToken');
                    var verificationToken = new verificationTokenModel({_userId: newUser._id});
                    verificationToken.createVerificationToken(function (err, token) {
                        if (err) return console.log("Couldn't create verification token", err);

                        var mailOptions = {
                            from: "Name here <Optional email here>", // sender address.  Must be the same as authenticated user if using GMail.
                            replyTo: "Optional email here",
                            to: email,                                              // receiver
                            subject: "Registratie HagaDiabetes", // subject
                            text: "Verifieer je account via http://" + req.get('host') + "/verify/" + token // body
                        }
                        smtpTransport.sendMail(mailOptions, function(err) {
                            if (err) req.flash('error', 'Je verificatiemail kon niet gestuurd worden.');
                            req.flash('success', 'Je verificatiemail is verstuurd.');
                        })

                        smtpTransport.close(); // shut down the connection pool, no more messages.  Comment this line out to continue sending emails.
                    });

	                // set the user's local credentials
	                newUser.email    	= email;
	                newUser.password 	= newUser.generateHash(password);
	                newUser.firstname 	= req.body.firstname;
	                newUser.lastname 	= req.body.lastname;

	                // save the user
	                newUser.save(function(err) {
	                    if (err)
	                        throw err;
	                    return done(null, newUser);
	                });
	            }

	        });    

        });

    }));
	
	// =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('error', 'Geen gebruiker gevonden.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('error', 'Dat wachtwoord is niet correct.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));
}