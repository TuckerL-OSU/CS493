const express = require('express');
const app = express();

app.use('/', require('./api/index'));

/* // Imports the Google Cloud client library.
const {Storage} = require('@google-cloud/storage');

// Instantiates a client. If you don't specify credentials when constructing
// the client, the client library will look for credentials in the
// environment.
const storage = new Storage();

// Makes an authenticated API request.
storage
	.getBuckets()
	.then((results) => {
		const buckets = results[0];

		console.log('Buckets:');
		buckets.forEach((bucket) => {
		  console.log(bucket.name);
		});
	})
	.catch((err) => {
		console.error('ERROR:', err);
	}); */

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});