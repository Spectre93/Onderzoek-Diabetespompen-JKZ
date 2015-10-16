/*
 *  quickstart.js
 *  ~~~~~~~~~~~~~
 *
 *  Code from the Stormpath Node.js Quickstart:
 *  http://docs.stormpath.com/nodejs/quickstart/
 *
 *  You can run this code by typing:
 *
 *      $ node quickstart.js
 *
 *  In your terminal.
 *
 *  Questions?  Email us!  support@stormpath.com
 */

var stormpath = require('stormpath');

var client = null;
var homedir = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;
var keyfile = homedir + '/.stormpath/apiKey.properties';


// Create a Stormpath Client.
stormpath.loadApiKey(keyfile, function apiKeyFileLoaded(err, apiKey) {
  if (err) throw err;
  client = new stormpath.Client({apiKey: apiKey});

  console.log('Created client!');

  // Get the Stormpath Application.
  client.getApplications(function(err, apps) {
    if (err) throw err;

    var app = apps.items[0];

    console.log('Application retrieved!');
    
    var account = {
      givenName: 'Joe',
      surname: 'Stormtrooper',
      username: 'tk455',
      email: 'stormtrooper@stormpath.com',
      password: 'Changeme1',
      customData: {
        favoriteColor: 'white',
      },
    };

    // Create a Stormpath Account.
    app.createAccount(account, function(err, account) {
      if (err) throw err;

      console.log('Account created!');
      console.log('Account givenName: ' + account.givenName);
      console.log('Account surname: ' + account.surname);

      // Search for Account by email.
      app.getAccounts({email: 'stormtrooper@stormpath.com'}, function(err, accounts) {
        if (err) throw err;

        accounts.each(function (err, account, index) {
          console.log('Found account using search by email!');
        });
      });

      // Authenticate Account by username / password.
      app.authenticateAccount({
        username: 'tk455',
        password: 'Changeme1',
      }, function (err, result) {
        if (err) throw err;
        console.log('Successfully authenticated account using username!');
      });

      // Authenticate Account by email / password.
      app.authenticateAccount({
        username: 'stormtrooper@stormpath.com',
        password: 'Changeme1',
      }, function (err, result) {
        if (err) throw err;
        console.log('Successfully authenticated account using email!');
      });
    });
  });
});