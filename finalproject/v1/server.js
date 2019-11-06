// Tucker Lavell
// My API needs a delay of 100-200ms. My tests work individually, 
// but sometimes in the full run, even with a delay it messes up.
// Credit to Laura Lund for the newCursor idea.
// http://lavellt-finalproject.appspot.com
// http://localhost:8080
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

const TRUCK = "Truck";
const PALLET = "Pallet";
const USER = "User";

const truckRouter = express.Router();
const palletRouter = express.Router();
const userRouter = express.Router();
const login = express.Router();

app.use(bodyParser.json());

/* @@@@@@@@@@@@@ Begin Helper Functions @@@@@@@@@@@@@ */
function check_truckName(name) {
	const query = datastore.createQuery(TRUCK);
    return datastore.runQuery(query)
	.then( (results) => {
		var trucks = results[0];
		
		trucks.forEach( function(truck) {
			if (truck.name == name) {
				trucks.invalidName = true;
			}
		});
		
		return trucks;
	});
}

function check_truckOwner(name) {
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

function check_palletHandler(pid) {
	const p_key = datastore.key([PALLET, parseInt(pid, 10)]);
    return datastore.get(p_key)
    .then( (pallet) => {
        if( typeof(pallet[0].handler) !== 'undefined'){
            pallet[0].alreadyOnTruck = true;
        }
        return pallet[0];
    });
}

function set_truckPallet(tid, pid) {
	const t_key = datastore.key([TRUCK, parseInt(tid, 10)]);
    return datastore.get(t_key)
    .then( (truck) => {
        if( typeof(truck[0].pallets) === 'undefined'){
            truck[0].pallets = [];
			truck[0].pallets.id = {};
        }
        truck[0].pallets.id = pid;
        truck[0].pallets.push(truck[0].pallets.id);    
		
		return datastore.save({"key": t_key, "data": truck[0]});		
    });
}

function set_palletHandler(tid, pid) {
	const p_key = datastore.key([PALLET, parseInt(pid, 10)]);
    return datastore.get(p_key)
    .then( (pallet) => {
        if( typeof(pallet[0].handler) === 'undefined'){
            pallet[0].handler = {};
        }
        pallet[0].handler = tid;
        return datastore.save({"key": p_key, "data": pallet[0]});
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
/* @@@@@@@@@@@@@ End Helper Functions @@@@@@@@@@@@@ */

/* @@@@@@@@@@@@@ Begin Model Functions @@@@@@@@@@@@@ */
/* ---------- Begin POST Functions ---------- */
function post_user(req) {
    var key = datastore.key(USER);
	const new_user = {"name": req.user.name};
	return datastore.save({"key": key, "data": new_user}).then(() => {return key});
}

function post_truck(req) {
    var key = datastore.key(TRUCK);
	const new_truck = {"name": req.body.name, "type": req.body.type, "length": req.body.length, "owner": req.user.name};
	return datastore.save({"key": key, "data": new_truck}).then(() => {return key});
}

function post_pallet(req) {
    var key = datastore.key(PALLET);
	const new_pallet = {"weight": req.body.weight, "content": req.body.content, "delivery_date": req.body.delivery_date};
	return datastore.save({"key": key, "data": new_pallet}).then(() => {return key});
}
/* ---------- End POST Functions ---------- */

/* ---------- Begin GET /:id Functions ---------- */
function get_truck(req) {
    const t_key = datastore.key([TRUCK, parseInt(req.params.tid, 10)]);
    return datastore.get(t_key)
	.then( (truck) => {
		ds.fromDatastore(truck[0]);
		truck[0].self = req.protocol + "://" + req.get("host") + req.baseUrl + "/" + req.params.tid;
		return truck[0];
    });
}

function get_usersTrucks(req) {
	var q = datastore.createQuery(TRUCK).filter("owner", "=", req.user.name).limit(5);
	var results = {};
	if(Object.keys(req.query).includes("cursor")) {
		console.log(req.query);
		// replace spaces with '+'
		var cursor = req.query.cursor;

		var newCursor = cursor.replace(' ', '+');
		
		q = q.start(newCursor);
	}
	return datastore.runQuery(q).then( (trucks) => {
		results.trucks = trucks[0].map(ds.fromDatastore);
		results.trucks.forEach((result) => {
			if (typeof(result.pallet) !== 'undefined') {
				var pallet = [];
				result.pallet.forEach((item) => {
					var truckPallet = {};
					truckPallet.id = item;
					truckPallet.self = req.protocol + "://" + req.get("host") + "/pallet/" + item;
					pallet.push(truckPallet);
				});
				
				result.pallet = pallet;
			}
			
			result.self = req.protocol + "://" + req.get("host") + "/trucks/" + result.id;
		});
		
		if(trucks[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
			results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/" + req.params.userid + "/trucks" + "?cursor=" + trucks[1].endCursor;
		}
		return results;
	});
}

function get_truckPallets(req) {
	const key = datastore.key([TRUCK, parseInt(req.params.tid, 10)]);
    return datastore.get(key)
    .then( (trucks) => {
        var truck = trucks[0];
		var truckPallets = {};
		if (typeof(truck.pallets) !== 'undefined') {
			var q = datastore.createQuery(PALLET).filter("handler", "=", req.params.tid).limit(5);
			var pallets = {};
			if(Object.keys(req.query).includes("cursor")){
				q = q.start(req.query.cursor);
			}
			return datastore.runQuery(q)
			.then( (results) => {
				pallets = results[0].map(ds.fromDatastore);
				pallets.forEach( (pallet) => {
					pallet.self = req.protocol + "://" + req.get("host") + "/pallets/" + pallet.id;
				});
				
				truckPallets.pallets = pallets;
				
				if(results[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
					truckPallets.next = req.protocol + "://" + req.get("host") + req.baseUrl + "/" + req.params.tid + "/pallets" + "?cursor=" + results[1].endCursor;
				}
				return truckPallets;
			});
		}
	});
}

function get_pallet(req) {
	const p_key = datastore.key([PALLET, parseInt(req.params.pid, 10)]);
    return datastore.get(p_key)
    .then( (pallet) => {
		ds.fromDatastore(pallet[0]);
		pallet[0].self = req.protocol + "://" + req.get("host") + req.baseUrl + "/" + pallet[0].id;
		return pallet[0];		
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
/* ---------- End GET /:id Functions ---------- */

/* ---------- Begin GET Functions ---------- */
function get_trucks(req) {
	var q = datastore.createQuery(TRUCK).limit(5);
	var results = {};
	if(Object.keys(req.query).includes("cursor")) {
		console.log(req.query);
		// replace spaces with '+'
		var cursor = req.query.cursor;

		var newCursor = cursor.replace(' ', '+');

		q = q.start(newCursor);
	}
	return datastore.runQuery(q).then( (trucks) => {
		results.trucks = trucks[0].map(ds.fromDatastore);
		results.trucks.forEach((result) => {
			if (typeof(result.pallet) !== 'undefined') {
				var pallet = [];
				result.pallet.forEach((item) => {
					var truckPallet = {};
					truckPallet.id = item;
					truckPallet.self = req.protocol + "://" + req.get("host") + "/pallet/" + item;
					pallet.push(truckPallet);
				});
				
				result.pallet = pallet;
			}
			
			result.self = req.protocol + "://" + req.get("host") + "/trucks/" + result.id;
		});
		
		if(trucks[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
			results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + trucks[1].endCursor;
		}
		return results;
	});
}

function get_pallets(req) {
	var q = datastore.createQuery(PALLET).limit(5);
	const results = {};
	if(Object.keys(req.query).includes("cursor")) {
		console.log(req.query);
		// replace spaces with '+'
		var cursor = req.query.cursor;

		var newCursor = cursor.replace(' ', '+');

		q = q.start(newCursor);
	}
	return datastore.runQuery(q).then( (pallets) => {
		results.pallets = pallets[0].map(ds.fromDatastore);
		results.pallets.forEach( (pallet) => {
			if (typeof(pallet.handler) !== 'undefined') {
				var handler = {};
				handler.id = pallet.handler;
				handler.self = req.protocol + "://" + req.get("host") + "/trucks/" + pallet.handler;
				pallet.handler = handler;
			}
			
			pallet.self = req.protocol + "://" + req.get("host") + req.baseUrl + "/" + pallet.id;
		});
		
		if(pallets[1].moreResults !== ds.Datastore.NO_MORE_RESULTS){
			results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + pallets[1].endCursor;
		}
		return results;
	});
}
/* ---------- End GET Functions ---------- */

/* ---------- Begin PUT Functions ---------- */
function update_truck(req) {
    const key = datastore.key([TRUCK, parseInt(req.params.tid, 10)]);
	return datastore.get(key)
	.then( truck => {
		ds.fromDatastore(truck[0]);
		var edit = req.body;
		if (edit.name) {
			truck[0].name = edit.name;
		}
		if (edit.type) {
			truck[0].type = edit.type;
		}
		if (edit.length) {
			truck[0].length = edit.length;
		}
		
		delete truck[0].id;
		return datastore.save({"key": key, "data": truck[0]}).then(() => {return key});
	});    
}

function put_palletOnTruck(req) {
	if (set_truckPallet(req.params.tid, req.params.pid)) {
		return set_palletHandler(req.params.tid, req.params.pid);
	}
}

function update_pallet(req) {
    const key = datastore.key([PALLET, parseInt(req.params.pid, 10)]);
    const pallet = {"weight": req.body.weight, "content": req.body.content, "delivery_date": req.body.delivery_date};
    return datastore.save({"key": key, "data": pallet}).then(() => {return key});
}
/* ---------- End PUT Functions ---------- */

/* ---------- Begin DELETE Functions ---------- */
// function delete_truck(id) {
    // const key = datastore.key([TRUCK, parseInt(id, 10)]);
    // return datastore.delete(key);
// }
function delete_truck(req, truck){
	if(typeof(truck.pallets) !== 'undefined'){
		truck.pallets.forEach( (pallet) => {
			req.params.pid = pallet;
			var deleteHandler = get_pallet(req)
			.then( (deleteHandler) => {
				const p_key = datastore.key([PALLET, parseInt(pallet, 10)]);
				delete deleteHandler.id;
				delete deleteHandler.self;
				delete deleteHandler.handler;
				datastore.save({"key": p_key, "data": deleteHandler});
			});
		});
	}
	return datastore.delete(datastore.key([TRUCK, parseInt(req.params.tid, 10)]));
}

function remove_palletFromTruck(req) {
	var truck = get_truck(req)
	.then( (truck) => {
		var temp = [];
		if (truck.pallets.length == 1) {
			delete truck.pallets;
		}
		else {
			truck.pallets.forEach( (pallet) => {
				if (pallet != req.params.pid) {
					temp.push(pallet);
				}
			});
			delete truck.pallets;
			truck.pallets = temp;
		}
		
		const t_key = datastore.key([TRUCK, parseInt(req.params.tid, 10)]);
		delete truck.self;
		delete truck.id;
		datastore.save({"key": t_key, "data": truck});
	});
	
	var pallet = get_pallet(req)
	.then( (pallet) => {
		if (typeof(pallet.handler) !== 'undefined') {
			const p_key = datastore.key([PALLET, parseInt(req.params.pid, 10)]);
			delete pallet.handler;
			delete pallet.self;
			delete pallet.id;
			datastore.save({"key": p_key, "data": pallet});
		}
	});
}

// function delete_pallet(id) {
	// const key = datastore.key([PALLET, parseInt(id, 10)]);
    // return datastore.delete(key);
// }
function delete_pallet(req, pallet){
	if(typeof(pallet.handler) !== 'undefined'){
		req.params.tid = pallet.handler;
		var truck = get_truck(req)
		.then( (truck) => {
			const t_key = datastore.key([TRUCK, parseInt(pallet.handler, 10)]);
			truck.pallets = truck.pallets.filter(item => item !== req.params.pid);
			// truck.pallets.forEach((item) => {
				// if (item == req.params.pid) {
					// if (truck.pallets.length > 1) {
						// console.log("truck.pallets.indexOf(pallet): " + truck.pallets.indexOf(pallet));
						// truck.pallets.splice(truck.pallets.indexOf(pallet), 1);
					// }
					// else {
						// delete truck.pallets;
					// }
				// }
			// });
			if (truck.pallets.length === 0) {
				delete truck.pallets;
			}
			delete truck.self;
			delete truck.id;
			datastore.save({"key": t_key, "data": truck});
		});
	}
	return datastore.delete(datastore.key([PALLET, parseInt(req.params.pid, 10)]));
}

function delete_user(id) {
	const key = datastore.key([USER, parseInt(id, 10)]);
    return datastore.delete(key);
}
/* ---------- End DELETE Functions ---------- */
/* @@@@@@@@@@@@@ End Model Functions @@@@@@@@@@@@@ */

/* @@@@@@@@@@@@@ Begin Controller Functions @@@@@@@@@@@@@ */
/* ---------- Begin POST Controller Functions ---------- */
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

truckRouter.post('/', checkJwt, function(req, res) {
    if(req.get('content-type') !== 'application/json') {
        res.status(415).send('Server only accepts application/json data.');
    }
	else {
		const accepts = req.accepts(['application/json']);
		if(!accepts) {
			res.status(406).send('Not Acceptable');
		}
		else if(accepts === 'application/json') {
			var checkOwner;
			return check_truckOwner(req.user.name)
			.then ( checkOwner => {
				if (typeof(checkOwner.alreadyExists) === 'undefined') {
					post_user(req)
					.then ( key => {
						checkOwner.id = key.id;
						return checkOwner;
					});			
				}
				return check_truckName(req.body.name)
				.then ( checkName => {
					if (checkName.invalidName) {
						res.status(403).send('A truck with that name already exists.');
					}
					else {
						return post_truck(req)
						.then( key => {
							res.cookie('owner', checkOwner.id, { expires: new Date(Date.now() + 1000), httpOnly: true});
							res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
							res.status(201).send('{ "id": ' + key.id + ' }');
						});
					}
				});
			});
		}
		else {
			res.status(500).send('Content type got messed up!');
		}
	}
});

palletRouter.post('/', function(req, res) {
	if(req.get('content-type') !== 'application/json') {
        res.status(415).send('Server only accepts application/json data.');
    }
	else {
		const accepts = req.accepts(['application/json']);
		if(!accepts) {
			res.status(406).send('Not Acceptable');
		}
		else if(accepts === 'application/json') {
			post_pallet(req)
			.then( key => {
				res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
				res.status(201).send('{ "id": ' + key.id + ' }')
			});
		} 
		else { 
			res.status(500).send('Content type got messed up!'); 
		}
	}
});
/* ---------- End POST Controller Functions ---------- */

/* ---------- Begin GET /:id Controller Functions ---------- */
truckRouter.get('/:tid', checkJwt, function(req, res) {
    const accepts = req.accepts(['application/json']);
	if(!accepts) {
		res.status(406).send('Not Acceptable');
	}
	else if(accepts === 'application/json') {
		const trucks = get_truck(req)
		.then( (truck) => {
			if (truck) {
				res.status(200).json(truck);
			}
		})
		.catch(function(err) {
			res.status(404).end();
		});		
	} 
	else { 
		res.status(500).send('Content type got messed up!'); 
	}
});

truckRouter.get('/:tid/pallets', checkJwt, function(req, res) {
	const pallets = get_truckPallets(req)
	.then( (pallets) => {
        res.status(200).json(pallets);
    })
	.catch(function(err) {
		res.status(404).end();
	});		
});

userRouter.get('/:userid/trucks', checkJwt, function(req, res) {	
	const accepts = req.accepts(['application/json']);
	if(!accepts) {
		res.status(406).send('Not Acceptable');
	}
	else if(accepts === 'application/json') {
		const user = get_user(req)
		.then( user => {
			if (user.name !== req.user.name) {
				res.status(403).send('You are not the owner.');
			}
			else {
				const trucks = get_usersTrucks(req)
				.then( (trucks) => {
					res.status(200).json(trucks);
				});
			}
		})
		.catch(function(err) {
			res.status(404).end();
		});		
	}
	else { 
		res.status(500).send('Content type got messed up!'); 
	}
});

palletRouter.get('/:pid', function(req, res) {
	const accepts = req.accepts(['application/json']);
	if(!accepts) {
		res.status(406).send('Not Acceptable');
	}
	else if(accepts === 'application/json') {
		const pallet = get_pallet(req)
		.then( (item) => {
			if (item) {
				res.status(200).json(item);
			}
		})
		.catch(function(err) {
			res.status(404).end();
		});		
	}
	else { 
		res.status(500).send('Content type got messed up!'); 
	}
});
/* ---------- End GET /:id Controller Functions ---------- */

/* ---------- Begin GET Controller Functions ---------- */
truckRouter.get('/', function(req, res) {
	const accepts = req.accepts(['application/json']);
	if(!accepts) {
		res.status(406).send('Not Acceptable');
	}
	else if(accepts === 'application/json'){
		const trucks = get_trucks(req)
		.then( (trucks) => {
			res.status(200).json(trucks);
		});
	} 
	else { 
		res.status(500).send('Content type got messed up!'); 
	}
});

palletRouter.get('/', function(req, res) {
    const accepts = req.accepts(['application/json']);
	if(!accepts) {
		res.status(406).send('Not Acceptable');
	}
	else if(accepts === 'application/json') {
		const pallet = get_pallets(req)
		.then( (items) => {
			res.status(200).json(items);
		});
	}
	else {
		res.status(500).send('Content type got messed up!'); 
	}
});
/* ---------- End GET Controller Functions ---------- */

/* ---------- Begin PUT Controller Functions ---------- */
truckRouter.put('/:tid', checkJwt, function(req, res) {
	if(req.get('content-type') !== 'application/json'){
        res.status(415).send('Server only accepts application/json data.');
    }
	else {
		const accepts = req.accepts(['application/json']);
		if(!accepts) {
			res.status(406).send('Not Acceptable');
		}
		else if(accepts === 'application/json') {
			var truck = get_truck(req)
			.then( truck => {
				if (truck.owner !== req.user.name) {
					res.status(403).send('You are not the owner.');
				}
				else {
					var checkName = check_truckName(req.body.name)
					.then ( checkName => {
						if (checkName.invalidName) {
							res.status(403).send('A Truck with that name already exists.');
						}
						else {
							update_truck(req)
							.then( key => {
								res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
								res.status(303).end();
							});
						}
					});
				}
			})
			.catch(function(err) {
				res.status(404).end();
			});
		} 
		else { 
			res.status(500).send('Content type got messed up!'); 
		}
	}
});

truckRouter.put('/:tid/pallets/:pid', checkJwt, function(req, res) {
	const accepts = req.accepts(['application/json']);
	if(!accepts) {
		res.status(406).send('Not Acceptable');
	}
	else if(accepts === 'application/json') {
		var truck = get_truck(req)
		.then( truck => {
			if (truck.owner !== req.user.name) {
				res.status(403).send('You are not the owner.');
			}
			else {
				var check = check_palletHandler(req.params.pid)
				.then( (check) => {
					if (check.alreadyOnTruck) {
						res.status(403).send('Could not put Pallet on Truck. That Pallet is on another Truck.').end();
					}
					else {
						put_palletOnTruck(req)
						.then(res.status(204).end());
					}
				});
			}
		})
		.catch(function(err) {
			res.status(404).end();
		});
	}
	else { 
		res.status(500).send('Content type got messed up!'); 
	}
});

palletRouter.put('/:pid', function(req, res) {
	if(req.get('content-type') !== 'application/json'){
        res.status(415).send('Server only accepts application/json data.');
    }
    else {
		const accepts = req.accepts(['application/json']);
		if(!accepts) {
			res.status(406).send('Not Acceptable');
		}
		else if(accepts === 'application/json') {
			update_pallet(req)
			.then( key => {
				res.location(req.protocol + "://" + req.get('host') + req.baseUrl + '/' + key.id);
				res.status(303).end();
			})
			.catch(function(err) {
				res.status(404).end();
			});
		}
		else { 
			res.status(500).send('Content type got messed up!'); 
		}
	}
});

truckRouter.put('/', function (req, res) {
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

palletRouter.put('/', function (req, res) {
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

userRouter.put('/', function (req, res) {
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});
/* ---------- End PUT Controller Functions ---------- */

/* ---------- Begin DELETE Controller Functions ---------- */
truckRouter.delete('/:tid', checkJwt, function(req, res) {
	const accepts = req.accepts(['application/json']);
	if(!accepts) {
		res.status(406).send('Not Acceptable');
	}
	else if(accepts === 'application/json') {
		const trucks = get_truck(req)
		.then( truck => {
			if (truck.owner !== req.user.name) {
				return res.status(403).send('You are not the owner.');
			}
			else {
				return delete_truck(req, truck)
				.then(res.status(204).end())
			}
		})
		.catch(function(err) {
			res.status(404).end();
		});
	}
	else {
		res.status(500).send('Content type got messed up!'); 
	}
});

// get truck twice
truckRouter.delete('/:tid/pallets/:pid', checkJwt, function(req, res) {
	const accepts = req.accepts(['application/json']);
	if(!accepts) {
		res.status(406).send('Not Acceptable');
	}
	else if(accepts === 'application/json') {
		const trucks = get_truck(req)
		.then( truck => {
			if (truck.owner != req.user.name) {
				return res.status(403).send('You are not the owner.');
			}
			else {
				remove_palletFromTruck(req);
				res.status(204).end();
			}
		})
		.catch(function(err) {
			res.status(404).end();
		});
	}
	else {
		res.status(500).send('Content type got messed up!'); 
	}
});

palletRouter.delete('/:pid', function(req, res) {
	const accepts = req.accepts(['application/json']);
	if(!accepts) {
		res.status(406).send('Not Acceptable');
	}
	else if(accepts === 'application/json') {
		const pallets = get_pallet(req)
		.then( pallet => {
			return delete_pallet(req, pallet)
			.then(res.status(204).end())
		})
		.catch(function(err) {
			res.status(404).end();
		});
	}
	else {
		res.status(500).send('Content type got messed up!'); 
	}
});

userRouter.delete('/:userid', checkJwt, function(req, res) {
	delete_user(req.params.userid)
	.then(res.status(204).end())
	.catch(function(err) {
		res.status(404).end();
	});
});

truckRouter.delete('/', function (req, res) {
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

palletRouter.delete('/', function (req, res) {
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});

userRouter.delete('/', function (req, res) {
    res.set('Accept', 'GET, POST');
    res.status(405).end();
});
/* ---------- End DELETE Controller Functions ---------- */
/* @@@@@@@@@@@@@ End Controller Functions @@@@@@@@@@@@@ */

app.use('/trucks', truckRouter);
app.use('/pallets', palletRouter);
app.use('/users', userRouter);
app.use('/login', login);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});