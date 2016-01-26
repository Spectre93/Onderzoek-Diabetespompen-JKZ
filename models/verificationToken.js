var mongoose = require('mongoose'),
	crypto = require('crypto');

//////////////////////////////
// Verification token model //
//////////////////////////////
var verificationTokenSchema = mongoose.Schema({
    _userId: { type: String, required: true, ref: 'User' },
    token: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: '4h' }
});


//////////////////////////////////
// Methods for the token schema //
//////////////////////////////////
verificationTokenSchema.methods.createVerificationToken = function (done) {
    var verificationToken = this;
    //var token = uuid.v4();
    var token = crypto.randomBytes(20).toString('hex');
    verificationToken.set('token', token);
    verificationToken.save( function (err) {
        if (err) return done(err);
        console.log("Verification token", verificationToken);
        return done(null, token);
    });
};

// Create module and expose
module.exports = mongoose.model('verificationToken', verificationTokenSchema);