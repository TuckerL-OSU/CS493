const express = require('express');
const bodyParser = require('body-parser');
// var session = require('express-session');

const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));
// router.use(session({secret: createSecret(), cookie: { maxAge: 60000}}));

// set up oauth
const { google } = require('googleapis');
const client_id = "674504424599-l8tjds3pj3d2n6k6busiihs7qfh7n8og.apps.googleusercontent.com"; // live
var clientSecret = "ByrFYBNuQAbRx6r9wglhzUML"; // live
const redirect = "https://lavellt-oauth2.appspot.com/oauth2/authorize"; // live
// const client_id = "674504424599-j9snsc9vg8ccl70bj8r1vvv9tdluj6cq.apps.googleusercontent.com"; // local
// var clientSecret = "sJhKhRHTV4QzcKSl3Mi-bFyC"; // local
// const redirect = "http://localhost:8080/oauth2/authorize"; // local

var oauth2Client = new google.auth.OAuth2(
	client_id,
	clientSecret,
	redirect
);

const people = google.people('v1');
google.options({
	auth: oauth2Client
});
var clientState;

function createState() {
	var state = "";
	var selection = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	
	for (var i = 0; i < 5; i++) {
		state += selection.charAt(Math.floor(Math.random() * selection.length));
	}
	
	console.log(state);
	return state;
}

function authenticate() {
	var authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: 'profile email',
	});
	authUrl = authUrl + "&state=" + clientState;
	return authUrl;
}

function getPerson() {
	return new Promise(function (resolve, reject) {
		const service = google.people({
			version: 'v1', 
			oauth2Client
		});
		
		var req = service.people.get({
			resourceName: 'people/me',
			personFields: 'names',
		}, (error, response) => {
			if(!error) {
				const personInfo = response.data;
				var person = {};
				person.fullName = personInfo.names[0].displayName;
				person.givenName = personInfo.names[0].givenName;
				person.familyName = personInfo.names[0].familyName;
				
				resolve(person);
			}
			else {
				reject("No data");
			}
		});
	});	
}

router.get('/', function(req, res) {
	var context = {};
	
	clientState = createState();
	
	context.link = authenticate(clientState);
	
	res.status(200);
	res.render('home', context);
});

router.get('/authorize', function(req, res) {	
	var context = {};
	var code = req.query.code;
	var returnState = req.query.state;
	
	if (returnState == clientState) {
		//POST to get token using the code we got back
		oauth2Client.getToken(code, (err, token) => {
			if (!err) {
				oauth2Client.setCredentials(token);		
				
				// with credentials set, get the persons info
				var person = getPerson()
				.then( (person) => {
					context = person;
					context.state = returnState;
					res.render('OAuth2', context);
				});
			}
		})	
	}
});

module.exports = router;