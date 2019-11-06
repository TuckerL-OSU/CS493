const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('../lib/datastore');

const datastore = ds.datastore;

const CARGO = "Cargo";
const BOAT = "Boat";

router.use(bodyParser.json());

async function print_cargo(req, id, cargo) {
	if(typeof(cargo.carrier) !== 'undefined'){
		const boat = await get_boat(cargo.carrier.id)
		.then( (boat) => {
			cargo.carrier.name = boat.name;
			return boat;
		});
		cargo.carrier.self = req.protocol + "://" + req.get("host") + "/boats/" + cargo.carrier.id;
	}
	
	cargo.id = id;
	cargo.self = req.protocol + "://" + req.get("host") + "/cargo/" + id;
	
	return cargo;		
}

// kind of working
// function print_cargo(req, id, cargo) {
	// if(typeof (cargo.carrier) !== 'undefined'){
		// const boat = get_boat(cargo.carrier.id);
		// cargo.carrier.name = boat.name;
		// cargo.carrier.self = req.protocol + "://" + req.get("host") + "/boats/" + cargo.carrier.id;
	// }
	
	// cargo.id = id;
	// cargo.self = req.protocol + "://" + req.get("host") + "/cargo/" + id;
	
	// return cargo;		
// }

function get_boat(id) {
	// var result = {};
	const b_key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.get(b_key)
    .then( (boat) => {		
		return boat[0];		
    });
}


/* ------------- Begin guest Model Functions ------------- */
function post_cargo(weight, content, delivery_date){
    var key = datastore.key(CARGO);
	const new_cargo = {"weight": weight, "content": content, "delivery_date": delivery_date};
	return datastore.save({"key": key, "data": new_cargo}).then(() => {return key});
}

// async function get_all_cargo(req) {
    // const c_key = datastore.key([CARGO, parseInt(sid, 10)]);
    // const new_date = (new Date()).toString();
	
    // const query = datastore.createQuery(CARGO).filter('id', '=', sid);
    // const result = await datastore.runQuery(query);

    // const slip_num = result[0].number;
    // const updated_slip = {"number": slip_num, "current_boat": bid, "arrival_date": new_date};
    // return datastore.update({"key": s_key, "data": updated_slip});
// }

// WORKING
async function get_all_cargo(req){
    var q = datastore.createQuery(CARGO).limit(3);
    const results = {};
    if(Object.keys(req.query).includes("cursor")){
        console.log(req.query);
        q = q.start(req.query.cursor);
    }
	return datastore.runQuery(q)
	.then( (entities) => {
		console.log(entities);
		results.cargo = entities[0].map(ds.fromDatastore);
		results.cargo.forEach(async (result) => {
			// var formatted = print_cargo(req, result.id, result);
			// .then( (formatted) => {
				// return formatted;
			// })
			
			if (typeof(result.carrier) !== 'undefined') {
				const b_key = datastore.key([BOAT, parseInt(result.carrier.id, 10)]);
				// result.carrier.name = 
			// });
			// datastore.save({"key": b_key, "data": boat});
				datastore.get(b_key)
				.then( (boat) => {
					result.carrier.name = boat.name;
				});
				// const boat = get_boat(result.carrier.id)
				// .then(async (boat) => {
					// result.carrier.name = await boat.name;
					// return boat.name;
				// });
				// result.carrier.name = boat.name;
				result.carrier.self = req.protocol + "://" + req.get("host") + "/boats/" + result.carrier.id;
				
				// result.carrier = cargoCarrier;
			}
			
			result.self = req.protocol + "://" + req.get("host") + "/cargo/" + result.id;
			// results.cargo = formatted;
		});
		if(entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS ){
			results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
		}
		return results;
	});
}

function get_cargo(id) {
	// var result = {};
	const c_key = datastore.key([CARGO, parseInt(id, 10)]);
    return datastore.get(c_key)
    .then( (cargo) => {		
		return cargo[0];		
    });
}

// function get_cargo(req, id) {
	// var result = {};
	// const c_key = datastore.key([CARGO, parseInt(id, 10)]);
    // return datastore.get(c_key)
    // .then( (cargo) => {
		// if (typeof(cargo[0].carrier) !== 'undefined') {
			// result = cargo[0];
			// var cargoCarrier = {};
			// cargoCarrier.id = cargo[0].carrier.id;
			// cargoCarrier.self = req.protocol + "://" + req.get("host") + "/boats/" + cargo[0].carrier.id;
			
			// result.carrier = cargoCarrier;
		// }
		
		// result.id = id;
		// result.self = req.protocol + "://" + req.get("host") + "/cargo/" + id;
		
		// return result;		
    // });
// }

function update_cargo(req, cargo) {
	// let boat = req.params.id;
	var edit = req.body;
	// var edittedBoat;
	console.log(edit);

	// edittedBoat = boat;
	
	if (cargo) {
		if (edit.weight != null) {
			cargo.weight = edit.weight;
		}
		if (edit.content != null) {
			cargo.content = edit.content;
		}
		if (edit.delivery_date != null) {
			cargo.delivery_date = edit.delivery_date;
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

	datastore.save(cargo).catch(err => {
		console.error('ERROR:', err);
	});
	
	return cargo;
}

// ??
function put_guest(id, name){
    const key = datastore.key([CARGO, parseInt(id, 10)]);
    const cargo = {"name": name};
    return datastore.save({"key":key, "data":cargo});
}

function delete_cargo(id, cargo){
	if(typeof(cargo.carrier) !== 'undefined'){
		const boat = get_boat(cargo.carrier.id)
		.then(async (boat) => {
			const b_key = await datastore.key([BOAT, parseInt(cargo.carrier.id, 10)]);
			boat.cargo.forEach((item) => {
				if (item == id) {
					if (boat.cargo.length > 1) {
						boat.cargo.splice(boat.cargo.indexOf(cargo.id), 1);
					}
					else {
						delete boat.cargo;
					}
				}
			});
			datastore.save({"key": b_key, "data": boat});
		});
	}
	return datastore.delete(datastore.key([CARGO, parseInt(id, 10)]));

    // const key = datastore.key([CARGO, parseInt(id, 10)]);
    // return datastore.delete(key);
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/', function(req, res){
    const cargo = get_all_cargo(req)
	.then( (cargo) => {
        res.status(200).json(cargo);
    });
});

/* router.get('/', function(req, res){
    const cargoes = get_all_cargo(req)
	.then( (cargoes) => {
		cargoes.forEach( (cargo) => {
			var cargoInfo = get_cargo(req, req.params.id)
			.then( (cargoInfo) => {
				var printedCargo = print_cargo(req, req.params.id, cargo);
				// .then( (printedCargo) => {
					// res.status(200).json(printedCargo);
				// });
			});
		});
        res.status(200).json(cargoes);
    });
});
 */
// router.get('/:id', function(req, res){
    // const cargo = get_cargo(req, req.params.id)
	// .then( (cargo) => {
		// res.status(200).json(cargo);
    // });
// });

// router.get('/:id', function(req, res){
    // const cargo = get_cargo(req, req.params.id)
	// .then( (cargo) => {
		// var printedCargo = print_cargo(req, req.params.id, cargo);
		// res.status(200).json(printedCargo);
    // });
// });

router.get('/:id', function(req, res){
    const cargo = get_cargo(req.params.id)
	.then( (cargo) => {
		var printedCargo = print_cargo(req, req.params.id, cargo)
		.then( (printedCargo) => {
			res.status(200).json(printedCargo);
		});
    });
});


/* router.get('/:id', function(req, res){
    const cargo = get_cargo(req, req.params.id)
	.then( (cargo) => {
		var boat;
		var printedCargo
		if (cargo.carrier !== 'undefined') {
			boat = get_boat(cargo.carrier.id)
			.then( (boat) => {
				printedCargo = print_cargo(req, req.params.id, cargo, boat);
				res.status(200).json(printedCargo);
			});
		}
		else {
			printedCargo = print_cargo(req, req.params.id, cargo, boat);
			res.status(200).json(printedCargo);
		}
    });
	// .then( (printedBoat) => {
		// res.status(200).json(printedBoat);
	// });
});
 */
router.post('/', function(req, res){
    console.log(req.body);
    post_cargo(req.body.weight, req.body.content, req.body.delivery_date)
    .then( key => {res.status(200).send('{ "id": ' + key.id + ' }')} );
});

router.put('/:id', function(req, res){
    put_guest(req.params.id, req.body.name)
    .then(res.status(200).end());
});

router.delete('/:id', function(req, res) {
	const cargo = get_cargo(req.params.id)
	.then( (cargo) => {
		var cargoToDelete = delete_cargo(req.params.id, cargo)
		// .then( (cargoToDelete) => {
			// res.status(204).end();
		// });
		res.status(204).end();
	});

});

router.patch('/:id', function(req, res) {
	const cargo = get_cargo(req.params.id)
	.then(async (cargo) => {
		var edittedCargo = update_cargo(req, cargo);
		var printedCargo = await print_cargo(req, req.params.id, edittedCargo);
		res.status(200).json(printedCargo);
    });
});

// router.delete('/:id', function(req, res){
    // delete_cargo(req.params.id).then(res.status(200).end());
// });

/* ------------- End Controller Functions ------------- */

module.exports = router;