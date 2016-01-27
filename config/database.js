module.exports = {
	url: 'mongodb://127.0.0.1:27017/diabetes-jkz',	// Database is run locally
	options: {
		replset: {
			socketOptions: {
				connectTimeoutMS : 1000 * 30 		// Try to connect for 30 seconds before giving up
			}
		}
	}
}