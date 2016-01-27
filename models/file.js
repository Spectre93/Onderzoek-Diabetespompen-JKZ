var mongoose = require('mongoose');

/////////////////////////////////////////////////
// File schema definition: properties per file //
/////////////////////////////////////////////////
var fileSchema = mongoose.Schema({
	time_uploaded: { type: Date, required: true },
	user_id: { type: String, required: true },
	original_name: { type: String, required: true },
    path: { type: String, required: true }
});

/////////////////////////////////
// Methods for the user schema //
/////////////////////////////////

// Create module and expose
module.exports = mongoose.model('File', fileSchema);