const express = require('express');
const app = express();

const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const projectId = 'lavellt-restful-api';
const datastore = new Datastore({projectId:projectId});

const LODGING = "Lodging";
const SLIP = "Slip";
const BOAT = "Boat";

var router = express.Router();
var boatRouter = express.Router();
var slipRouter = express.Router();

app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}

function createID() {
	var id = "";
	var selection = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	
	for (var i = 0; i < 5; i++) {
		id += selection.charAt(Math.floor(Math.random() * selection.length));
	}
	
	console.log(id);
	return id;
}

function post_slip(new_slip){
    var key = datastore.key(SLIP);
	// const new_slip = {"number": num, "current_boat": current_boat, "arrival_date": arrival_date};
	return datastore.save({"key": key, "data": new_slip}).then(() => {return key});
}

function post_boat(newBoat){
    var key = datastore.key(BOAT);
	// const new_boat = {"name": name, "type": type, "length": len};
	// console.log(newBoat);
	return datastore.save({"key": key, "data": newBoat}).then(() => {return key});
}

// *********** ROUTES ***********
// ******* BOAT *******
// create new boat
boatRouter.post('/', function(req, res, next) {
	console.log(req.body);
    // post_boat(req.body.name, req.body.type, req.body.length)
    // .then( key => {res.status(200).send('{ "id": ' + key.id + ' }')} );
	var newBoat = {};
	//default for empty request
	if (!req.body) {
		newBoat = {
			id: createID(),
			name: "empty body boat",
			type: "boat",
			length: 10,
		};
	}
	else {
//	    if (req.body.id) {
//	        newBoat = {
//                id: req.body.id,
//            	// name: reqbody.name,
//            	// type: reqBody.type,
//            	// length: reqBody.length,
//            	name: req.body.name,
//            	type: req.body.type,
//            	length: req.body.length
//            };
//	    }
//	    else {
            newBoat = {
                id: createID(),
                // name: reqbody.name,
                // type: reqBody.type,
                // length: reqBody.length,
                name: req.body.name,
                type: req.body.type,
                length: req.body.length,
            };
//	    }
	}

    var boatName = null;
//    console.log(boatName);
//    const key = datastore.key(BOAT);
//    const [boats] = await datastore.get(BOAT);
//    boats.forEach((boat) => {
//        if (boat.name === newBoat.name) {
//            boatName = boat.name;
//        }
//    });
//    datastore.get(key, function(err, entity) {
//
//    });
//    datastore.get(BOAT, function(err, boats).then((results) => {
//        boats = results[0];
//    }) {
//        boats.forEach((boat) => {
//            if (boat.name === newBoat.name) {
//                boatName = boat.name;
//            }
//        });
//    });

    var code = "200";
	const query = datastore.createQuery(BOAT);
    datastore.runQuery(query).then((results) => {
        var boats = results[0];

        boats.forEach(function(boat) {
            if (boat.name == newBoat.name) {
//                res.status(403).send(`A boat with that name already exists.`).end();
                code = "403";
            }
        });

        if (code == "403") {
            res.status(code).send(`A boat with that name already exists.`).end();
        }
        else {
            post_boat(newBoat);
            res.status(code).send(newBoat).end();
        }

//        post_boat(newBoat);
//        res.status(200).send(newBoat).end();
    })
    .catch(next);

//	const query = datastore.createQuery(BOAT).filter('name', newBoat.name);
//	datastore.runQuery(query).then((results) => {
//		var boat = results[0][0];
//
////		console.log(typeof boat);
//
//		if (boat) {
//		    res.status(403).send(`A boat with that name already exists.`).end();
//		}
//		else {
//            res.status(200).send(newBoat).end();
//		}
//	})
//	.catch(next);

//    if (boatName == null) {
////        post_boat(newBoat);
////        res.status(200).send(newBoat).end();
//    }
//    else {
//        res.status(403).send(`A boat with that name already exists.`).end();
//    }

//	 console.log(newBoat);
//	 post_boat(newBoat);
//
//	 res.status(200).send(newBoat).end();
});

// get list of boats
boatRouter.get('/', function (req, res, next) {
	const query = datastore.createQuery(BOAT);
	datastore.runQuery(query).then((results) => {
		var boats = results[0];
		
		boats.forEach((boat) => {
			boat.url = 'http://' + req.headers.host + '/boats/' + boat.id;
		});
		// res.status(200).send(`BoatID\t\tName\t\t\tType\tLength\n${info.join('\n')}`).end();
		res.status(200).send(boats).end();
	})
	.catch(next);
});

// get a boat by id
boatRouter.get('/:id', function(req, res, next) {
	let boatID = req.params.id;
	console.log(boatID);
	
	const query = datastore.createQuery(BOAT).filter('id', boatID);
	datastore.runQuery(query).then((results) => {
		var boat = results[0][0];
		
		console.log(typeof boat);
		
		if (boat) {
			boat.url = 'http://' + req.headers.host + '/boats/' + boat.id;
			res.status(200).send(boat).end();
		}
		else {
			res.status(404).send(`Boat not found.`).end();	
		}
	})
	.catch(next);
});

// edit boat
boatRouter.patch('/:id', function(req, res, next) {
	let boat = req.params.id;
	var edit = req.body;
	var edittedBoat;
	console.log(edit);

	const query = datastore.createQuery(BOAT).filter('id', boat);
  	
  	query.run(function(err, entities) {	 
  		// var keys = entities.map(function(boat) {
			//// datastore.KEY is a Symbol
			// return boat[datastore.KEY];
    	// });

    	edittedBoat = entities[0];
		if (edittedBoat) {
			if (edit.name != null) {
				edittedBoat.name = edit.name;
			}
			if (edit.type != null) {
				edittedBoat.type = edit.type;
			}
			if (edit.length != null) {
				edittedBoat.length = edit.length;
			}
		}
		
    	datastore.save(edittedBoat).catch(err => {
    		console.error('ERROR:', err);
		});
		
		res.status(200).send(edittedBoat).end();
    });
});

// delete a boat
boatRouter.delete('/:id', function(req, res, next) {
	let boatID = req.params.id;
	const query = datastore.createQuery(BOAT).filter('id', boatID);
	
	query.run(function(err, entities) {	 
		var keys = entities.map(function(boat) {
        // datastore.KEY is a Symbol
			return boat[datastore.KEY];
    	});
		
    	console.log(entities[0].name);

        var boat = entities[0];
    	//if not at_sea, then find the slip
    	if(boat) {
    		console.log('check here');
    		var q = datastore.createQuery(SLIP).filter('current_boat', entities[0].id);
			console.log(q);

			q.run(function(err, task) {
				console.log(task[0]);
				var mykey = task.map(function(slip) {
					return slip[datastore.KEY];
				});
    		
				var slip = task[0];
				slip.current_boat = null;
				slip.arrival_date = null;

				datastore.save(slip).catch(err => {
					console.error('ERROR:', err);
				});
			})
    	}
		
		datastore.delete(keys);
    	console.log(entities[0]);
	});
	
   	 res.status(204).send(`Boat deleted.`).end();
});

// ******* SLIP *******
// create new slip
slipRouter.post('/', function(req, res, next) {
	var newSlip = {};
	
		if (!req.body) {
		newSlip = {
			id: createID(),
			number: 0,
			current_boat: null,
			arrival_date: new Date(Date.now()),
			// slip_history: null,
		};
	}
	else {		
		newSlip = {
			id: createID(),
			number: req.body.number,
			current_boat: null,
			arrival_date: null,
		};
	}

    var code = "200";
    const query = datastore.createQuery(SLIP);
    datastore.runQuery(query).then((results) => {
        var slips = results[0];

        slips.forEach(function(slip) {
            if (slip.number == newSlip.number) {
//                res.status(403).send(`A boat with that name already exists.`).end();
                code = "403";
            }
        });

        if (code == "403") {
            res.status(code).send(`A slip with that number already exists.`).end();
        }
        else {
            post_slip(newSlip);
            res.status(code).send(newSlip).end();
        }

//        post_boat(newBoat);
//        res.status(200).send(newBoat).end();
    })
    .catch(next);

//    const query = datastore.createQuery(BOAT);
//    datastore.runQuery(query).then((results) => {
//        var slips = results[0];
//
//        slips.forEach((slip) => {
//            if (slip.name == newSlip.name) {
//                res.status(403).send(`A slip with that number already exists.`).end();
//            }
//        });
//        post_slip(newSlip);
//        res.status(200).send(newSlip).end();
//    })
//    .catch(next);


//	    let slipNum = newSlip.number;
//        console.log(slipNum);
//
//        const query = datastore.createQuery(SLIP).filter('number', slipNum);
//        datastore.runQuery(query).then((results) => {
//            var slip = results[0][0];
//
//            console.log(typeof slip);
//
//            if (slip.number === slipNum) {
//                res.status(403).send(`A slip with that number already exists.`).end();
//            }
//            else {
//                post_slip(newSlip);
//
//                res.status(200).send(newSlip).end();
//            }
//        })
//        .catch(next);

	
//	 console.log(newSlip);
//	 post_slip(newSlip);
//
//	 res.status(200).send(newSlip).end();
});

// get list of slips
slipRouter.get('/', function(req, res, next) {
	const query = datastore.createQuery(SLIP);
	datastore.runQuery(query).then((results) => {
		var slips = results[0];
		
		slips.forEach((slip) => {
			slip.url = 'http://' + req.headers.host + '/slips/' + slip.id;
			if (slip.current_boat) {
                slip.boat_url = 'http://' + req.headers.host + '/boats/' + slip.current_boat;
            }
		});
		res.status(200).send(slips).end();
	})
	.catch(next);
});

// get a slip by id
slipRouter.get('/:id', function(req, res, next) {
	let slipID = req.params.id;
	console.log(slipID);
	
	const query = datastore.createQuery(SLIP).filter('id', slipID);
	datastore.runQuery(query).then((results) => {
		var slip = results[0][0];
		
		console.log(slip);
		
		if (slip) {
			slip.slip_url = 'http://' + req.headers.host + '/slips/' + slip.id;
			if (slip.current_boat) {
			    slip.boat_url = 'http://' + req.headers.host + '/boats/' + slip.current_boat;
			}
			res.status(200).send(slip).end();
		}
		else {
			res.status(404).send(`Slip not found.`).end();
		}
	})
	.catch(next);
});

// edit slip
slipRouter.patch('/:id', function(req, res, next){
	let slip = req.params.id;
	var edit = req.body;
	var edittedSlip;
	console.log(edit);

	const query = datastore.createQuery(SLIP).filter('id', slip)

	query.run(function(err, entities) {
  		console.log(entities[0]);
  		// var keys = entities.map(function(slip) {
			//// datastore.KEY is a Symbol
			// return slip[datastore.KEY];
    	// });

    	edittedSlip = entities[0];
		if (edittedSlip) {
			if (edit.number != null) {
				edittedSlip.number = edit.number;
			}
			if (edit.current_boat != null) {
				edittedSlip.current_boat = edit.current_boat;
			}
			if (edit.arrival_date != null) {
				edittedSlip.arrival_date = edit.arrival_date;
			}
		}

    	datastore.save(edittedSlip).catch(err => {
    		console.error('ERROR:', err);
		});
		
		res.status(200).send(edittedSlip).end();
    });
});

// slipRouter.put('/:id',function(req,res,next){
	// let boat = req.params.id;
	// var task = req.body;

	// const query = datastore.createQuery(BOAT).filter('id', boat);

  	// query.run(function(err, entities) {

  		// console.log(entities[0]);
  		// var keys = entities.map(function(entity) {
        	// return entity[datastore.KEY];
    	// });
    	
    	// var status = datastore.createQuery('Slip').filter('id', task.id);

		// status.run(function(err,data) {
		 
			// var mykey = data.map(function(data2) {
				// return data2[datastore.KEY];});

			// console.log(data[0]);
			
			// if(data[0].current_boat !== null) {
				// res.status(403).send("Slip cant moved in! Already full!").end();
			// }
			// else {
				// update the currentboat and arrival data.
				// var newslip =data[0];
				// newslip.arrival_date=task.arrival_date;
				// newslip.current_boat=boat;
				// datastore.save(newslip).catch(err => {
					// console.error('ERROR:', err);
				// });
			// }
		// });

		// update boat at_sea
		// console.log(entities[0]);
		// var newboat=entities[0];
    	// newboat.at_sea = false;

    	// datastore.save(newboat).catch(err => {
    		// console.error('ERROR:', err);
		// });
    // });

   	// res.status(201).send(`Boat ${boat} moved in!`).end();
// })

// put a boat in a slip
slipRouter.put('/:slipID/boats/:boatID', function (req, res, next) {
	let slipID = req.params.slipID;
	let boatID = req.params.boatID;

	const query = datastore.createQuery(SLIP).filter('id', slipID);

  	query.run(function(err, entities) {
  		console.log(entities[0]);
    	
		var slip = entities[0];
		
		if (slip && slip.current_boat) {
			slip.boat_url = 'http://' + req.headers.host + '/boats/' + slip.current_boat;
			res.status(403).send(slip).end();
		}
		else if (slip) {
			var boatQuery = datastore.createQuery(BOAT).filter('id', boatID);
			
			boatQuery.run(function(err, entities) {
				var boat = entities[0];
				
				if (boat) {
					slip.current_boat = boat.id;
					slip.arrival_date = new Date();
					
//					boat.at_sea = false;
					
					datastore.save(slip).catch(err => {
						console.error('ERROR:', err);
					});
//					datastore.save(boat).catch(err => {
//						console.error('ERROR:', err);
//					});

					res.status(200).send(slip).end();
				}
				else {
					res.status(404).send(`Boat not found.`).end();
				}
			})
		}
//		else if (slip.current_boat) {
//		    if (slip.current_boat === boatID) {
//
//		    }
//		    res.status(200).send(`Boat put to sea.`).end();
//		}
		else {
			res.status(404).send(`Slip not found.`).end();
		}
    });
//	res.status(500).send(`Server Error.`).end();
})

// remove a boat from a slip
slipRouter.delete('/:slipID/boats/:boatID', function (req, res, next) {
	let slipID = req.params.slipID;
	let boatID = req.params.boatID;

	const query = datastore.createQuery(SLIP).filter('id', slipID);

  	query.run(function(err, entities) {
  		console.log(entities[0]);

		var slip = entities[0];

//		if (slip && slip.current_boat) {
//			res.status(403).send(`This slip is already occupied.`).end();
//		}
		if (slip) {
			var boatQuery = datastore.createQuery(BOAT).filter('id', boatID);

			boatQuery.run(function(err, entities) {
				var boat = entities[0];

				if (boat) {
					slip.current_boat = null;
					slip.arrival_date = null;

//					boat.at_sea = false;

					datastore.save(slip).catch(err => {
						console.error('ERROR:', err);
					});
//					datastore.save(boat).catch(err => {
//						console.error('ERROR:', err);
//					});

                    res.status(200).send(slip).end();
				}
				else {
					res.status(404).send(`Boat not found.`).end();
				}
			})
		}
//		else if (slip.current_boat) {
//		    if (slip.current_boat === boatID) {
//
//		    }
//		    res.status(200).send(`Boat put to sea.`).end();
//		}
		else {
			res.status(404).send(`Slip not found.`).end();
		}
    });
//	res.status(500).send(`Server Error.`).end();
})

// delete a slip
slipRouter.delete('/:id', function(req, res, next) {
	 let slip = req.params.id;
	 const query = datastore.createQuery(SLIP).filter('id', slip)
  	
  	query.run(function(err, entities){
  		//console.log(entities)
  		var keys = entities.map(function(slip){
  			return slip[datastore.KEY];
  		});
  		
  		datastore.delete(keys);
  		//console.log(entities[0])
  		if(entities[0].current_boat !== null){
  			var status = datastore.createQuery(BOAT).filter('id', entities[0].current_boat)
  			console.log(status);

  			status.run(function(err, task){
	  			console.log(task[0]);
  				var mykeys = task.map(function(task2){
  					return task2[datastore.KEY];
				});

    			var newboat = task[0];
//    			newboat.at_sea = true;

    			datastore.save(newboat).catch(err => {
    			    console.error('ERROR:', err);
    			});
  			})
  		}
  	});
	
   	res.status(204).send(`Slip deleted.`).end();  
});

/* ------------- End Controller Functions ------------- */

app.use('/boats', boatRouter);
app.use('/slips', slipRouter);


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});