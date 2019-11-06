// http://localhost:8080
// http://lavellt-boatstatus.appspot.com
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
// const json2html = require('json-to-html');
const json2html = require('node-json2html');
const router = express.Router();
const ds = require('../lib/datastore');

const datastore = ds.datastore;

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const SHIP = "Ship";

router.use(bodyParser.json());

/* ------------- Begin Ship Helper Functions ------------- */
function check_boatName(name) {
	const query = datastore.createQuery(SHIP);
    return datastore.runQuery(query)
	.then( (results) => {
		var boats = results[0];
		
		boats.forEach( function(boat) {
			if (boat.name == name) {
				boats.invalidName = true;
			}
		});
		
		return boats;
	});
}

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://osu-cs493.auth0.com/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://osu-cs493.auth0.com/`,
    algorithms: ['RS256']
  });
/* ------------- End Ship Helper Functions ------------- */

/* ------------- Begin Boat Model Functions ------------- */
function post_boat(req) {
    var key = datastore.key(SHIP);
	const new_boat = {"name": req.body.name, "type": req.body.type, "length": req.body.length};
	return datastore.save({"key": key, "data": new_boat}).then(() => {return key});
}

function get_boats(req) {
	const q = datastore.createQuery(SHIP);
	return datastore.runQuery(q).then( (boats) => {
		// var results = {};
		boats[0].map(ds.fromDatastore);
		boats[0].forEach( (boat) => {
			boat.self = req.protocol + "://" + req.get("host") + req.baseUrl + "/" + boat.id;
		});
		// results.boats = boats[0];
		// return results;
		return boats[0];
	});
}

function get_boat(req) {
	const b_key = datastore.key([SHIP, parseInt(req.params.id, 10)]);
	return datastore.get(b_key)
	.then( (boat) => {
		if (typeof(boat[0]) !== "undefined") {
			ds.fromDatastore(boat[0]);
			boat[0].self = req.protocol + "://" + req.get("host") + req.baseUrl + "/" + req.params.id;
			return boat[0];
		}
		else {
			return null;
		}
	});
}

function put_boat(req){
    const key = datastore.key([SHIP, parseInt(req.params.id, 10)]);
    const boat = {"name": req.body.name, "type": req.body.type, "length": req.body.length};
    return datastore.save({"key": key, "data": boat}).then(() => {return key});
}

function delete_boat(id){
    const key = datastore.key([SHIP, parseInt(id, 10)]);
    return datastore.delete(key);
}
/* ------------- End Boat Model Functions ------------- */

/* ------------- Begin Boat Controller Functions ------------- */
router.get('/', function(req, res){
    const boats = get_boats(req)
	.then( (boats) => {
        res.status(200).json(boats);
    });
});

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
router.get('/:id', function(req, res){
	// maybe boats
    const boat = get_boat(req)
	.then( (boat) => {
		if (boat === null) {
			res.status(404).send('Boat Not Found');
		}
		else {
			const accepts = req.accepts(['application/json', 'text/html']);
			if(!accepts){
				res.status(406).send('Not Acceptable');
			}
			else if(accepts === 'application/json'){
				res.status(200).json(boat);
			} 
			else if(accepts === 'text/html'){
				var transform = {'<>':'ul', 'html' :[
					{'<>':'li', 'html': '\"id\": \"${id}\"'},
					{'<>':'li', 'html': '\"name\": \"${name}\"'},
					{'<>':'li', 'html': '\"type\": \"${type}\"'},
					{'<>':'li', 'html': '\"length\": \"${length}\"'},
					{'<>':'li', 'html': '\"self\": \"${self}\"'}
				]};
				var html = json2html.transform(boat, transform);
				// res.status(200).send(json2html(boat).slice(1,-1));
				res.status(200).send(html);
			} 
			else { 
				res.status(500).send('Content type got messed up!'); 
			}
		}
    });
});

router.post('/', function(req, res){
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send('Server only accepts application/json data.');
    }
    else {
		var checkName = check_boatName(req.body.name)
		.then ( check => {
			if (check.invalidName) {
				res.status(403).send('A Boat with that name already exists.');
			}
			else {
				post_boat(req)
				.then( key => {
					res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
					res.status(201).send('{ "id": ' + key.id + ' }');
				});
			}
		});
	}
});

router.put('/:id', function(req, res){
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send('Server only accepts application/json data.');
    }
    else {
		var checkName = check_boatName(req.body.name)
		.then ( check => {
			if (check.invalidName) {
				res.status(403).send('A Boat with that name already exists.');
			}
			else {
				put_boat(req)
				.then( key => {
					res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
					res.status(303).end();
				});
			}
		});
	}
});

router.delete('/:id', function(req, res){
    delete_boat(req.params.id)
	.then(res.status(204).end())
});

// client cannot do that
router.delete('/', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

router.put('/', function (req, res){
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

/* ------------- End Boat Controller Functions ------------- */

module.exports = router;

