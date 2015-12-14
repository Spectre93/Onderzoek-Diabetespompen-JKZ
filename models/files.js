var mongoose = require('mongoose');

/////////////////////////////////////////////////
// Files schema definition: properties per user //
/////////////////////////////////////////////////
var filesSchema = mongoose.Schema({
	userId: { type: String, required: true },
	originalName: { type: String, required: true },
    path: { type: String, required: true }
});

/////////////////////////////////
// Methods for the user schema //
/////////////////////////////////

// Create module and expose
module.exports = mongoose.model('Files', filesSchema);