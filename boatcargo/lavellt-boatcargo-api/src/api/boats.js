// http://localhost:8080
// http://lavellt-boatcargo-api.appspot.com
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('../lib/datastore');

const datastore = ds.datastore;

const BOAT = "Boat";
const CARGO = "Cargo";

router.use(bodyParser.json());

/* ------------- Begin Boat Helper Functions ------------- */
function check_boatName(name) {
	const query = datastore.createQuery(BOAT);
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

async function check_cargoCarrier(cid) {
	const c_key = datastore.key([CARGO, parseInt(cid, 10)]);
    return datastore.get(c_key)
    .then( (cargo) => {
        if( typeof(cargo[0].carrier) !== 'undefined'){
            cargo[0].alreadyOnBoat = true;
        }
        return cargo[0];
    });
}

function set_boatCargo(bid, cid) {
	const b_key = datastore.key([BOAT, parseInt(bid, 10)]);
    return datastore.get(b_key)
    .then( (boat) => {
        if( typeof(boat[0].cargo) === 'undefined'){
            boat[0].cargo = [];
			boat[0].cargo.id = {};
        }
        boat[0].cargo.id = cid;
        boat[0].cargo.push(boat[0].cargo.id);    
		
		return datastore.save({"key": b_key, "data": boat[0]});		
    });
}

function set_cargoCarrier(bid, cid) {
	const c_key = datastore.key([CARGO, parseInt(cid, 10)]);
    return datastore.get(c_key)
    .then( (cargo) => {
        if( typeof(cargo[0].carrier) === 'undefined'){
            cargo[0].carrier = {};
            // cargo[0].carrier.id = {};
        }
        cargo[0].carrier.id = bid;
        return datastore.save({"key": c_key, "data": cargo[0]});
    });
}

function print_boat(req, id, boat) {
	if( typeof(boat.cargo) !== 'undefined'){
		var cargo = [];
		boat.cargo.forEach((item) => {
			var boatCargo = {};
			boatCargo.id = item;
			boatCargo.self = req.protocol + "://" + req.get("host") + "/cargo/" + item;
			cargo.push(boatCargo);
		});
		
		boat.cargo = cargo;
	}
	
	boat.id = id;
	boat.self = req.protocol + "://" + req.get("host") + "/boats/" + id;
	
	return boat;		
}

function get_cargo(id) {
	const c_key = datastore.key([CARGO, parseInt(id, 10)]);
    return datastore.get(c_key)
    .then( (cargo) => {		
		return cargo[0];		
    });
}

/* function create_selfLink(linkType, data) {
	
} */
/* ------------- End Boat Helper Functions ------------- */

/* ------------- Begin Boat Model Functions ------------- */
function post_boat(name, type, length) {
    var key = datastore.key(BOAT);
	const new_boat = {"name": name, "type": type, "length": length};
	return datastore.save({"key": key, "data": new_boat}).then(() => {return key});
}
// function post_boat(name, type, length){
    // var key = datastore.key(BOAT);
	// if (check_name(name) == null) {
		// const new_boat = {"name": name, "type": type, "length": length};
		// return datastore.save({"key": key, "data": new_boat}).then(() => {return key});
	// }
	// else {
		// return name;
	// }
// }

function get_boats(req){
    var q = datastore.createQuery(BOAT).limit(3);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q)
	.then( (entities) => {
		results.boats = entities[0].map(ds.fromDatastore);
		results.boats.forEach((result) => {
			if (typeof(result.cargo) !== 'undefined') {
				var cargo = [];
				result.cargo.forEach((item) => {
					var boatCargo = {};
					boatCargo.id = item;
					boatCargo.self = req.protocol + "://" + req.get("host") + "/cargo/" + item;
					cargo.push(boatCargo);
				});
				
				result.cargo = cargo;
			}
			
			result.self = req.protocol + "://" + req.get("host") + "/boats/" + result.id;
		});
		if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
			results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
		}
		return results;
	});
}

// WORKING GET_BOAT
// function get_boat(req, id) {
	// var result = {};
	// const b_key = datastore.key([BOAT, parseInt(id, 10)]);
    // return datastore.get(b_key)
    // .then( (boat) => {
		// result = boat[0];
		// result.id = id;
        // if( typeof(boat[0].cargo) !== 'undefined'){
            // var cargo = [];
			// result.cargo.forEach((item) => {
				// var boatCargo = {};
				// boatCargo.id = item;
				// boatCargo.self = req.protocol + "://" + req.get("host") + "/cargo/" + item;
				// cargo.push(boatCargo);
			// });
			
			// result.cargo = cargo;
        // }
		
		// result.self = req.protocol + "://" + req.get("host") + "/boats/" + id;
		
		// return result;		
    // });
// }

function get_boat(id) {
	// var result = {};
	const b_key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.get(b_key)
    .then( (boat) => {		
		return boat[0];		
    });
}

/* function get_boat_cargo(req, id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.get(key)
    .then( (boats) => {
        const boat = boats[0];
		// @@@@@@@@@@@@@@@@@@@@@@@ pluralize maybe also c_id
        const cargo_keys = boat.cargo.map( (c_id) => {
            return datastore.key([CARGO, parseInt(c_id, 10)]);
        });
        return datastore.get(cargo_keys);
    })
	// @@@@@@@@@@@@@@@@@ maybe pluralize
    .then((cargo) => {
        cargo = cargo[0].map(ds.fromDatastore);
        return cargo;
    });
} */

/* function get_boat_cargo(req, id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.get(key)
    .then( (boats) => {
        const boat = boats[0];
		// @@@@@@@@@@@@@@@@@@@@@@@ pluralize maybe also c_id
        const cargo_keys = boat.cargo.map( (c_id) => {
            return datastore.key([CARGO, parseInt(c_id, 10)]);
        });
        return datastore.get(cargo_keys);
    })
	// @@@@@@@@@@@@@@@@@ maybe pluralize
    .then((cargo) => {
        cargo = cargo[0].map(ds.fromDatastore);
        return cargo;
    });
}
 */
function get_boat_cargo(req, id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.get(key)
    .then( (boats) => {
        var boat = boats[0];
		// if !undefined
			// for each boat.cargo -> carrier
			// look up w/ limit/cursor
				// gets the carrier for each cargo in the boat
				// cargo id
				// cargo self
			// next link
		if (typeof(boat.cargo) !== 'undefined') {
			var q = datastore.createQuery(CARGO).filter('id', id).limit(3);
			const results = {};
			if(Object.keys(req.query).includes("cursor")){
				q = q.start(req.query.cursor);
			}
			return datastore.runQuery(q)
			.then( (entities) => {
				results.cargoes = entities[0].map(ds.fromDatastore);
				results.cargoes.forEach( (result) => {
					var cargo = [];
					result.cargo.forEach(async (item) => {
						if (item == id) {
							var boatCargo = {};
							boatCargo.id = item;
							boatCargo.self = req.protocol + "://" + req.get("host") + "/cargo/" + item;
							cargo.push(boatCargo);
						}
					});
					
					result.cargo = cargo;
					
					result.self = req.protocol + "://" + req.get("host") + "/boats/" + result.id;
				});
				if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
					results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
				}
				return results;
			});
		}
		return boat;
    });	
	
}

// update boat
// @@@@@@@@@@@@@@@@@@ add cargo @@@@@@@@@@@@@@@@@@@
function update_boat(req, id, boat) {
	// let boat = req.params.id;
	var edit = req.body;
	// var edittedBoat;
	console.log(edit);

	// edittedBoat = boat;
	
	if (boat) {
		if (edit.name != null) {
			boat.name = edit.name;
		}
		if (edit.type != null) {
			boat.type = edit.type;
		}
		if (edit.length != null) {
			boat.length = edit.length;
		}
		if (edit.cargo != null) {
			if (typeof(boat.cargo) === 'undefined') {
				boat.cargo = [];
			}
			edit.cargo.forEach( function(item) {
				boat.cargo.push(item);
				set_cargoCarrier(id, item);
			});
		}
	}
	
	// strip editted of self links
	// if (typeof(boat.cargo) !== 'undefined') {
		// boat.cargo.forEach((cargo) => {
			// edittedBoat.cargo.push(cargo);
		// });
	// }
	// if (typeof(edittedBoat.self) !== 'undefined') {
		// delete edittedBoat.self;
	// }

	datastore.save(boat).catch(err => {
		console.error('ERROR:', err);
	});
	
	return boat;
}

// ??
function put_lodging(id, name, description, price){
    const key = datastore.key([LODGING, parseInt(id,10)]);
    const lodging = {"name": name, "description": description, "price": price};
    return datastore.save({"key":key, "data":lodging});
}

async function delete_boat(id, boat){
	if(typeof(boat.cargo) !== 'undefined'){
		boat.cargo.forEach( (item) => {
			const deleteCarrier = get_cargo(item)
			.then( (deleteCarrier) => {
				const c_key = datastore.key([CARGO, parseInt(item, 10)]);
				delete deleteCarrier.carrier;
				datastore.save({"key": c_key, "data": deleteCarrier});
			});
		});
	}
	return await datastore.delete(datastore.key([BOAT, parseInt(id, 10)]));
}

// boat id/cargo id
function put_cargoOnBoat(bid, cid){
    if (set_boatCargo(bid, cid)) {
		return set_cargoCarrier(bid, cid);
	}
	// return set_cargoCarrier(set_boatCargo(bid, cid), cid);
}

async function remove_cargoFromBoat(bid, cid) {
	var boat = get_boat(bid)
	.then( (boat) => {
		boat.cargo.forEach( (item) => {
			if (item == cid) {
				boat.cargo.splice(cid, 1);
			}
		});
		
		const b_key = datastore.key([BOAT, parseInt(bid, 10)]);
		if (boat.cargo.length == 1) {
			delete boat.cargo;
		}
		
		datastore.save({"key": b_key, "data": boat});
	});
	var cargo = get_cargo(cid)
	.then( (cargo) => {
		if (typeof(cargo.carrier) !== 'undefined') {
			const c_key = datastore.key([CARGO, parseInt(cid, 10)]);
			delete cargo.carrier;
			datastore.save({"key": c_key, "data": cargo});
		}
	});
	
	return null;
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', function(req, res){
    const boats = get_boats(req)
	.then( (boats) => {
        res.status(200).json(boats);
    });
});

// router.get('/:id', function(req, res){
    // const boat = get_boat(req, req.params.id)
	// .then( (boat) => {
		// res.status(200).json(boat);
    // });
// });
router.get('/:id', function(req, res){
    const boat = get_boat(req.params.id)
	.then( (boat) => {
		var printedBoat = print_boat(req, req.params.id, boat);
		res.status(200).json(printedBoat);
    });
	// .then( (printedBoat) => {
		// res.status(200).json(printedBoat);
	// });
});

router.get('/:id/cargo', function(req, res){
    const boats = get_boat_cargo(req, req.params.id)
	.then( (boats) => {
        res.status(200).json(boats);
    });
});

// router.post('/', function(req, res){
    // post_boat(req.body.name, req.body.type, req.body.length)
    // .then( key => {res.status(200).send('{ "id": ' + key.id + ' }')} );
// });
router.post('/', function(req, res){
	var check = check_boatName(req.body.name)
	.then( (check) => {
		if (check.invalidName) {
			res.status(403).send('A Boat with that name already exists.');
		}
		else {
			post_boat(req.body.name, req.body.type, req.body.length)
			.then( key => {res.status(200).send('{ "id": ' + key.id + ' }')} );
		}
	});
});

// router.patch('/:id', function(req, res) {
	// const boat = get_boat(req.params.id)
	// .then( (boat) => {
		// var edittedBoat = update_boat(req, boat);
		// var printedBoat = print_boat(req, req.params.id, edittedBoat);
		// res.status(200).json(printedBoat);
    // });
// });

// working
// router.patch('/:id', async function(req, res, next) {
	// var check = null;
	// if (req.body.name) {
		// check = await check_boatName(req.body.name)
	// }
	
	// if (check.invalidName) {
		// res.status(403).send('Could not Update Boat. A Boat with that name already exists.').end();
	// }
	// else {
		// const boat = get_boat(req.params.id)
		// .then( (boat) => {
			// var edittedBoat = update_boat(req, boat);
			// var printedBoat = print_boat(req, req.params.id, edittedBoat);
			// res.status(200).json(printedBoat);
		// });
	// }
// });
/* router.patch('/:id', async function(req, res, next) {
	var check = null;
	if (req.body.name) {
		check = await check_boatName(req.body.name);
	}
	
	if (req.body.cargo) {
		check = req.body;
		// check.cargo = req.body.cargo;
		check.cargo.forEach(async (item) => {
			var result = await check_cargoCarrier(item)
			.then( (result) => {
				if (result.alreadyOnBoat) {
					check.alreadyOnBoat = true;
				}
				if (typeof(result) === 'undefined') {
					check.doesNotExist = true;
				}

			});
			
		});
	}
	
	if (check.invalidName) {
		res.status(403).send('Could not Update Boat. A Boat with that name already exists.').end();
	}
	else if (check.alreadyOnBoat) {
		res.status(403).send('Could not Update Boat. Another Boat is already carrying that Cargo.').end();
	}
	else if (check.doesNotExist) {
		res.status(403).send('Could not Update Boat. This Cargo does not exist.').end();
	}
	else {
		const boat = get_boat(req.params.id)
		.then( (boat) => {
			var edittedBoat = update_boat(req, req.params.id, boat);
			var printedBoat = print_boat(req, req.params.id, edittedBoat);
			res.status(200).json(printedBoat);
		});
	}
});
 */
 
router.patch('/:id', async function(req, res) {
	var check = null;
	if (req.body.name) {
		check = await check_boatName(req.body.name);
	}
	
	if (req.body.cargo) {
		check = req.body;
		// check.cargo = req.body.cargo;
		check.cargo.forEach(async (item) => {
			var result = await check_cargoCarrier(item)
			.then( (result) => {
				if (result.alreadyOnBoat) {
					check.alreadyOnBoat = true;
					// res.status(403).send('Could not Update Boat. Another Boat is already carrying that Cargo.').end();
				}
				if (typeof(result) === 'undefined') {
					check.doesNotExist = true;
					// res.status(403).send('Could not Update Boat. This Cargo does not exist.').end();
				}
				return check;
			});
		});
	}
	
	if (check.invalidName) {
		res.status(403).send('Could not Update Boat. A Boat with that name already exists.').end();
	}
	else if (check.alreadyOnBoat) {
		res.status(403).send('Could not Update Boat. Another Boat is already carrying that Cargo.').end();
	}
	else if (check.doesNotExist) {
		res.status(403).send('Could not Update Boat. This Cargo does not exist.').end();
	}
	else {
		const boat = get_boat(req.params.id)
		.then( (boat) => {
			var edittedBoat = update_boat(req, req.params.id, boat);
			var printedBoat = print_boat(req, req.params.id, edittedBoat);
			res.status(200).json(printedBoat);
		})
	}
});

router.put('/:bid/cargo/:cid', function(req, res) {
    var check = check_cargoCarrier(req.params.cid)
	.then( (check) => {
		if (check.alreadyOnBoat) {
			res.status(403).send('Could not put Cargo on Boat. That Cargo is on another Boat.').end();
		}
		else {
			put_cargoOnBoat(req.params.bid, req.params.cid)
			.then().then(res.status(200).end());
		}
	});
});

router.delete('/:id', function(req, res){
	const boat = get_boat(req.params.id)
	.then( (boat) => {
		var boatToDelete = delete_boat(req.params.id, boat)
		.then( (boatToDelete) => {
			res.status(204).end();
		});
	});
});

router.delete('/:bid/cargo/:cid', function(req, res) {
	const result = remove_cargoFromBoat(req.params.bid, req.params.cid)
	.then( (result) => {
		res.status(204).end();
	});
});


/* ------------- End Controller Functions ------------- */

module.exports = router;