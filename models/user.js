var mongoose = require('mongoose'),
	bcrypt = require('bcrypt-nodejs');

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
	verified: { type:Boolean, default: false },
	resetPasswordToken: String,
	resetPasswordExpires: Date
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

// Create module and expose
module.exports = mongoose.model('User', userSchema);