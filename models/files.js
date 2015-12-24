var mongoose = require('mongoose');

/////////////////////////////////////////////////
// Files schema definition: properties per user //
/////////////////////////////////////////////////
var filesSchema = mongoose.Schema({
	time_uploaded: { type: Date, required: true },
	user_id: { type: String, required: true },
	original_name: { type: String, required: true },
    path: { type: String, required: true }
});

/////////////////////////////////
// Methods for the user schema //
/////////////////////////////////

// Create module and expose
module.exports = mongoose.model('Files', filesSchema);