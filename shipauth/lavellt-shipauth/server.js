// Tucker Lavell
// My API needs a delay of 100-200ms. My tests work individually, 
// but sometimes in the full run, even with a delay it messes up.
const express = require('express');
const app = express();

const json2html = require('node-json2html');

const Datastore = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const request = require('request');

const projectId = 'cs493-node-js-sample';
const ds = require('./lib/datastore');

const datastore = ds.datastore;

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const SHIP = "Ship";
const USER = "User";

const shipRouter = express.Router();
const userRouter = express.Router();
const login = express.Router();

app.use(bodyParser.json());

/* ------------- Begin Helper Functions ------------- */
function check_shipName(name) {
	const query = datastore.createQuery(SHIP);
    return datastore.runQuery(query)
	.then( (results) => {
		var ships = results[0];
		
		ships.forEach( function(ship) {
			if (ship.name == name) {
				ships.invalidName = true;
			}
		});
		
		return ships;
	});
}

function check_shipOwner(name) {
	const query = datastore.createQuery(USER).filter('name', '=', name);
    return datastore.runQuery(query)
	.then( (result) => {
		var user = result[0].map(ds.fromDatastore);
		
		if (user.length != 0) {
			user.id = user[0].id;
			user.alreadyExists = true;
		}
		
		return user;
	});
}

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://lavellt-osu.auth0.com/.well-known/jwks.json`
    }),
  
    // Validate the audience and the issuer.
    issuer: `https://lavellt-osu.auth0.com/`,
    algorithms: ['RS256']
});
/* ------------- End Helper Functions ------------- */

/* ------------- Begin Model Functions ------------- */
function post_ship(req) {
    var key = datastore.key(SHIP);
	const new_ship = {"name": req.body.name, "type": req.body.type, "length": req.body.length, "owner": req.user.name};
	return datastore.save({"key": key, "data": new_ship}).then(() => {return key});
}

function post_user(req) {
    var key = datastore.key(USER);
	const new_user = {"name": req.user.name};
	return datastore.save({"key": key, "data": new_user}).then(() => {return key});
}

function get_users_ships(req){
	const q = datastore.createQuery(SHIP);
	return datastore.runQuery(q).then( (ships) => {
		var usersShips = {};
		usersShips = ships[0].map(ds.fromDatastore).filter( ship => ship.owner === req.user.name);
		usersShips.forEach( (userShip) => {
			userShip.self = req.protocol + "://" + req.get("host") + "/ships/" + userShip.id;
		});
		
		return usersShips;
	});
}

function get_ships(req){
	const q = datastore.createQuery(SHIP);
	return datastore.runQuery(q).then( (ships) => {
		ships[0].map(ds.fromDatastore);
		ships[0].forEach( (ship) => {
			ship.self = req.protocol + "://" + req.get("host") + req.baseUrl + "/" + ship.id;
		});
		
		return ships[0];
	});
}

function get_ship(req){
    const s_key = datastore.key([SHIP, parseInt(req.params.id, 10)]);
    return datastore.get(s_key).then( (ship) => {
		ds.fromDatastore(ship[0]);
		ship[0].self = req.protocol + "://" + req.get("host") + "/ships/" + ship[0].id;
		return ship[0];
    });
}

function get_user(req) {
	const u_key = datastore.key([USER, parseInt(req.params.userid, 10)]);
	return datastore.get(u_key)
	.then( user => {
		ds.fromDatastore(user[0]);
		// console.log("user0: " + user[0]);
		return user[0];
	});
}

function delete_ship(id){
    const key = datastore.key([SHIP, parseInt(id, 10)]);
    return datastore.delete(key);
}

function delete_user(id) {
	const key = datastore.key([USER, parseInt(id, 10)]);
    return datastore.delete(key);
}
/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */
// userRouter.get('/:userid/ships', checkJwt, function(req, res){	
	// const ships = get_users_ships(req)
	// .then( (ships) => {
        // res.status(200).json(ships);
    // });
// });

userRouter.get('/:userid/ships', checkJwt, function(req, res){	
	const user = get_user(req)
	.then( user => {
		if (user.name !== req.user.name) {
			res.status(401).end();
		}
		else {
			const ships = get_users_ships(req)
			.then( (ships) => {
				res.status(200).json(ships);
			});
		}
	});
});

userRouter.delete('/:userid', checkJwt, function(req, res) {
	delete_user(req.params.userid)
	.then(res.status(204).end());
});

shipRouter.get('/', function(req, res){
    const ships = get_ships(req)
	.then( (ships) => {
        res.status(200).json(ships);
    });
});

shipRouter.get('/:id', checkJwt, function(req, res){
    const ships = get_ship(req)
	.then( (ship) => {
		if (ship === null) {
			res.status(404).send('Ship Not Found');
		}
		else {
			const accepts = req.accepts(['application/json', 'text/html']);
			if(!accepts){
				res.status(406).send('Not Acceptable');
			}
			else if(accepts === 'application/json'){
				res.status(200).json(ship);
			} 
			else if(accepts === 'text/html'){
				var transform = {'<>':'ul', 'html' :[
					{'<>':'li', 'html': '\"id\": \"${id}\"'},
					{'<>':'li', 'html': '\"name\": \"${name}\"'},
					{'<>':'li', 'html': '\"type\": \"${type}\"'},
					{'<>':'li', 'html': '\"length\": \"${length}\"'},
					{'<>':'li', 'html': '\"self\": \"${self}\"'}
				]};
				var html = json2html.transform(ship, transform);
				res.status(200).send(html);
			} 
			else { 
				res.status(500).send('Content type got messed up!'); 
			}
		}
    });
});

// shipRouter.post('/', checkJwt, function(req, res){
    // if(req.get('content-type') !== 'application/json'){
        // res.status(415).send('Server only accepts application/json data.');
    // }
    // else {
		// var checkOwner = check_shipOwner(req.user.name)
		// .then ( checkOwner => {
			// if (typeof(checkOwner.alreadyExists) === 'undefined') {
				// post_user(req)
				// .then( key => {
					// checkOwner.id = key.id;
				// });
			// }
			// var checkName = check_shipName(req.body.name)
			// .then ( check => {
				// if (check.invalidName) {
					// res.status(403).send('A Ship with that name already exists.');
				// }
				// else {
					// post_ship(req)
					// .then( key => {
						// res.cookie('owner', checkOwner.id, { expires: new Date(Date.now() + 1000), httpOnly: true});
						// res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
						// res.status(201).send('{ "id": ' + key.id + ' }');
					// });
				// }
			// });
		// });
	// }
// });

// shipRouter.post('/', checkJwt, function(req, res){
    // if(req.get('content-type') !== 'application/json'){
        // res.status(415).send('Server only accepts application/json data.');
    // }
    // else {
		// check_shipOwner(req.user.name)
		// .then ( checkOwner => {
			// if (typeof(checkOwner.alreadyExists) === 'undefined') {
				// post_user(req)
				// .then ( key => {
					// checkOwner.id = key.id;
					// return checkOwner;
				// });
				
			// }
			// return check_shipName(req.body.name)
			// .then ( checkName => {
				// if (checkName.invalidName) {
					// res.status(403).send('A Ship with that name already exists.');
				// }
				// else {
					// post_ship(req)
					// .then( key => {
						// res.cookie('owner', checkOwner.id, { expires: new Date(Date.now() + 1000), httpOnly: true});
						// res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
						// res.status(201).send('{ "id": ' + key.id + ' }');
					// });
				// }
			// });
		// });
	// }
// });

shipRouter.post('/', checkJwt, function(req, res){
    if(req.get('content-type') !== 'application/json'){
        res.status(415).send('Server only accepts application/json data.');
    }
    else {
		var checkOwner;
		return check_shipOwner(req.user.name)
		.then ( checkOwner => {
			if (typeof(checkOwner.alreadyExists) === 'undefined') {
				post_user(req)
				.then ( key => {
					checkOwner.id = key.id;
					return checkOwner;
				});
				
			}
			return check_shipName(req.body.name)
			.then ( checkName => {
				if (checkName.invalidName) {
					res.status(403).send('A Ship with that name already exists.');
				}
				else {
					return post_ship(req)
					.then( key => {
						res.cookie('owner', checkOwner.id, { expires: new Date(Date.now() + 1000), httpOnly: true});
						res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
						res.status(201).send('{ "id": ' + key.id + ' }');
					});
				}
			});
		});
	}
});

shipRouter.delete('/:id', checkJwt, function(req, res){
	const ships = get_ship(req)
	.then( ship => {
		if (ship.owner != req.user.name) {
			return res.status(403).end();
		}
		else {
			return delete_ship(req.params.id)
			.then(res.status(204).end())
		}
	});
});

// shipRouter.delete('/:id', checkJwt, function(req, res){
	// const ships = get_ship(req)
	// .then( ship => {
		// if (ship.owner != req.user.name) {
			// res.status(403).end();
		// }
		// else {
			// return delete_ship(req.params.id)
			// .then(res.status(204).end())
		// }
	// });
// });

login.post('/', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    var options = { method: 'POST',
    url: 'https://lavellt-osu.auth0.com/oauth/token',
    headers: { 'content-type': 'application/json' },
    body:
     { grant_type: 'password',
       username: username,
       password: password,
       client_id: 'pJ8QMklCAoFz4To8T8fw01jr7XsAC9gd',
       client_secret: 'XyfdtXClKb5NlUIJQAvnkhYhpG5KU0PCuTK542CC6d2353y9EP_1I0s6tSDF4YDg' },
    json: true };
    request(options, (error, response, body) => {
        if (error){
            res.status(500).send(error);
        } else {
            res.send(body);
        }
    });
});
/* ------------- End Controller Functions ------------- */

app.use('/ships', shipRouter);
app.use('/users', userRouter);
app.use('/login', login);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});