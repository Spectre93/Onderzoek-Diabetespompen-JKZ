var mongoose = require('mongoose'),
	bcrypt = require('bcrypt-nodejs'),
	crypto = require('crypto');

/////////////////////////////////////////////////
// User schema definition: properties per user //
/////////////////////////////////////////////////
var userSchema = mongoose.Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	firstname: { type: String, required: true },
	lastname: { type: String, required: true },
	accountType: { type: String, required: true, default: "patient" },
	accessFrom: { type: Array, default: [] },
	accessTo: { type: Array, default: [] },
	verified: { type: Boolean, default: false },
	resetPasswordToken: String,
	resetPasswordExpires: Date,
    token: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: '4h' }
});

/////////////////////////////////
// Methods for the user schema //
/////////////////////////////////

// Generate hash to encrypt PW
userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// Check if PW is valid
userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};

userSchema.methods.createVerificationToken = function (done) {
    var user = this;
    //var token = uuid.v4();
    var token = crypto.randomBytes(20).toString('hex');
    user.set('token', token);
    user.save( function (err) {
        if (err) return done(err);
        console.log("Verification token added to user: \n", user);
        return done(null, token);
    });
};

// Create module and expose
module.exports = mongoose.model('User', userSchema);