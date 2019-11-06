"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// http://localhost:8080
// http://lavellt-boatcargo.appspot.com
var express = require('express');

var bodyParser = require('body-parser');

var router = express.Router();

var ds = require('../lib/datastore');

var datastore = ds.datastore;
var BOAT = "Boat";
var CARGO = "Cargo";
router.use(bodyParser.json());
/* ------------- Begin Boat Helper Functions ------------- */

function check_boatName(name) {
  var query = datastore.createQuery(BOAT);
  return datastore.runQuery(query).then(function (results) {
    var boats = results[0];
    boats.forEach(function (boat) {
      if (boat.name == name) {
        boats.invalidName = true;
      }
    });
    return boats;
  });
}

function check_cargoCarrier(_x) {
  return _check_cargoCarrier.apply(this, arguments);
}

function _check_cargoCarrier() {
  _check_cargoCarrier = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(cid) {
    var c_key;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            c_key = datastore.key([CARGO, parseInt(cid, 10)]);
            return _context3.abrupt("return", datastore.get(c_key).then(function (cargo) {
              if (typeof cargo[0].carrier !== 'undefined') {
                cargo[0].alreadyOnBoat = true;
              }

              return cargo[0];
            }));

          case 2:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _check_cargoCarrier.apply(this, arguments);
}

function set_boatCargo(bid, cid) {
  var b_key = datastore.key([BOAT, parseInt(bid, 10)]);
  return datastore.get(b_key).then(function (boat) {
    if (typeof boat[0].cargo === 'undefined') {
      boat[0].cargo = [];
      boat[0].cargo.id = {};
    }

    boat[0].cargo.id = cid;
    boat[0].cargo.push(boat[0].cargo.id);
    return datastore.save({
      "key": b_key,
      "data": boat[0]
    });
  });
}

function set_cargoCarrier(bid, cid) {
  var c_key = datastore.key([CARGO, parseInt(cid, 10)]);
  return datastore.get(c_key).then(function (cargo) {
    if (typeof cargo[0].carrier === 'undefined') {
      cargo[0].carrier = {}; // cargo[0].carrier.id = {};
    }

    cargo[0].carrier.id = bid;
    return datastore.save({
      "key": c_key,
      "data": cargo[0]
    });
  });
}

function print_boat(req, id, boat) {
  if (typeof boat.cargo !== 'undefined') {
    var cargo = [];
    boat.cargo.forEach(function (item) {
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
  var c_key = datastore.key([CARGO, parseInt(id, 10)]);
  return datastore.get(c_key).then(function (cargo) {
    return cargo[0];
  });
}
/* function create_selfLink(linkType, data) {
	
} */

/* ------------- End Boat Helper Functions ------------- */

/* ------------- Begin Boat Model Functions ------------- */


function post_boat(name, type, length) {
  var key = datastore.key(BOAT);
  var new_boat = {
    "name": name,
    "type": type,
    "length": length
  };
  return datastore.save({
    "key": key,
    "data": new_boat
  }).then(function () {
    return key;
  });
} // function post_boat(name, type, length){
// var key = datastore.key(BOAT);
// if (check_name(name) == null) {
// const new_boat = {"name": name, "type": type, "length": length};
// return datastore.save({"key": key, "data": new_boat}).then(() => {return key});
// }
// else {
// return name;
// }
// }


function get_boats(req) {
  var q = datastore.createQuery(BOAT).limit(3);
  var results = {};

  if (Object.keys(req.query).includes("cursor")) {
    q = q.start(req.query.cursor);
  }

  return datastore.runQuery(q).then(function (entities) {
    results.boats = entities[0].map(ds.fromDatastore);
    results.boats.forEach(function (result) {
      if (typeof result.cargo !== 'undefined') {
        var cargo = [];
        result.cargo.forEach(function (item) {
          var boatCargo = {};
          boatCargo.id = item;
          boatCargo.self = req.protocol + "://" + req.get("host") + "/cargo/" + item;
          cargo.push(boatCargo);
        });
        result.cargo = cargo;
      }

      result.self = req.protocol + "://" + req.get("host") + "/boats/" + result.id;
    });

    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
      results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }

    return results;
  });
} // WORKING GET_BOAT
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
  var b_key = datastore.key([BOAT, parseInt(id, 10)]);
  return datastore.get(b_key).then(function (boat) {
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


function get_boat_cargo(req, id) {
  var key = datastore.key([BOAT, parseInt(id, 10)]);
  return datastore.get(key).then(function (boats) {
    var boat = boats[0];
    var boatCargo = {}; // if !undefined
    // for each boat.cargo -> carrier
    // look up w/ limit/cursor
    // gets the carrier for each cargo in the boat
    // cargo id
    // cargo self
    // next link

    if (typeof boat.cargo !== 'undefined') {
      var q = datastore.createQuery(CARGO).filter("carrier.id", id).limit(3);
      var results = {};

      if (Object.keys(req.query).includes("cursor")) {
        q = q.start(req.query.cursor);
      }

      return datastore.runQuery(q).then(function (entities) {
        results = entities[0].map(ds.fromDatastore);
        results.forEach(function (result) {
          // var cargo = [];
          // var boatCargo = {};
          // boatCargo.id = result.c;
          result.self = req.protocol + "://" + req.get("host") + "/cargo/" + result.id; // boatCargo.cargo.push(result);
          // result.carrier.forEach(async (item) => {
          // if (item == id) {
          // var boatCargo = {};
          // boatCargo.id = item;
          // boatCargo.self = req.protocol + "://" + req.get("host") + "/cargo/" + item;
          // cargo.push(boatCargo);
          // }
          // });
          // result.cargo = cargo;
          // result.self = req.protocol + "://" + req.get("host") + "/boats/" + result.id;
        });
        boatCargo.cargo = results;

        if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
          boatCargo.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
        }

        return boatCargo;
      }); // return boatCargo;
    }
  });
} // update boat
// @@@@@@@@@@@@@@@@@@ add cargo @@@@@@@@@@@@@@@@@@@


function update_boat(req, id, boat) {
  // let boat = req.params.id;
  var edit = req.body; // var edittedBoat;

  console.log(edit); // edittedBoat = boat;

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
      if (typeof boat.cargo === 'undefined') {
        boat.cargo = [];
      }

      edit.cargo.forEach(function (item) {
        boat.cargo.push(item);
        set_cargoCarrier(id, item);
      });
    }
  } // strip editted of self links
  // if (typeof(boat.cargo) !== 'undefined') {
  // boat.cargo.forEach((cargo) => {
  // edittedBoat.cargo.push(cargo);
  // });
  // }
  // if (typeof(edittedBoat.self) !== 'undefined') {
  // delete edittedBoat.self;
  // }


  datastore.save(boat)["catch"](function (err) {
    console.error('ERROR:', err);
  });
  return boat;
}

function delete_boat(_x2, _x3) {
  return _delete_boat.apply(this, arguments);
} // boat id/cargo id


function _delete_boat() {
  _delete_boat = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4(id, boat) {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (typeof boat.cargo !== 'undefined') {
              boat.cargo.forEach(function (item) {
                var deleteCarrier = get_cargo(item).then(function (deleteCarrier) {
                  var c_key = datastore.key([CARGO, parseInt(item, 10)]);
                  delete deleteCarrier.carrier;
                  datastore.save({
                    "key": c_key,
                    "data": deleteCarrier
                  });
                });
              });
            }

            _context4.next = 3;
            return datastore["delete"](datastore.key([BOAT, parseInt(id, 10)]));

          case 3:
            return _context4.abrupt("return", _context4.sent);

          case 4:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _delete_boat.apply(this, arguments);
}

function put_cargoOnBoat(bid, cid) {
  if (set_boatCargo(bid, cid)) {
    return set_cargoCarrier(bid, cid);
  } // return set_cargoCarrier(set_boatCargo(bid, cid), cid);

}

function remove_cargoFromBoat(bid, cid) {
  var boat = get_boat(bid).then(function (boat) {
    var temp = [];

    if (boat.cargo.length == 1) {
      delete boat.cargo;
    } else {
      boat.cargo.forEach(function (item) {
        if (item != cid) {
          temp.push(item);
        }
      });
      delete boat.cargo; // temp.forEach( (putback) => {
      // boat.cargo.push(putback);
      // });

      boat.cargo = temp;
    }

    var b_key = datastore.key([BOAT, parseInt(bid, 10)]);
    datastore.save({
      "key": b_key,
      "data": boat
    });
  });
  var cargo = get_cargo(cid).then(function (cargo) {
    if (typeof cargo.carrier !== 'undefined') {
      var c_key = datastore.key([CARGO, parseInt(cid, 10)]);
      delete cargo.carrier;
      datastore.save({
        "key": c_key,
        "data": cargo
      });
    }
  });
}
/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */


router.get('/', function (req, res) {
  var boats = get_boats(req).then(function (boats) {
    res.status(200).json(boats);
  });
}); // router.get('/:id', function(req, res){
// const boat = get_boat(req, req.params.id)
// .then( (boat) => {
// res.status(200).json(boat);
// });
// });

router.get('/:id', function (req, res) {
  var boat = get_boat(req.params.id).then(function (boat) {
    if (!boat) {
      res.status(404).send("Boat not found.").end();
    } else {
      var printedBoat = print_boat(req, req.params.id, boat);
      res.status(200).json(printedBoat);
    }
  }); // .then( (printedBoat) => {
  // res.status(200).json(printedBoat);
  // });
});
router.get('/:id/cargo', function (req, res) {
  var cargo = get_boat_cargo(req, req.params.id).then(function (cargo) {
    res.status(200).json(cargo);
  });
}); // router.post('/', function(req, res){
// post_boat(req.body.name, req.body.type, req.body.length)
// .then( key => {res.status(200).send('{ "id": ' + key.id + ' }')} );
// });

router.post('/', function (req, res) {
  var check = check_boatName(req.body.name).then(function (check) {
    if (check.invalidName) {
      res.status(403).send('A Boat with that name already exists.');
    } else {
      post_boat(req.body.name, req.body.type, req.body.length).then(function (key) {
        res.status(200).send('{ "id": ' + key.id + ' }');
      });
    }
  });
}); // router.patch('/:id', function(req, res) {
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

router.patch('/:id',
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(req, res) {
    var check, boat;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            check = null;

            if (!req.body.name) {
              _context2.next = 5;
              break;
            }

            _context2.next = 4;
            return check_boatName(req.body.name);

          case 4:
            check = _context2.sent;

          case 5:
            if (req.body.cargo) {
              check = req.body; // check.cargo = req.body.cargo;

              check.cargo.forEach(
              /*#__PURE__*/
              function () {
                var _ref2 = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee(item) {
                  var result;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.next = 2;
                          return check_cargoCarrier(item).then(function (result) {
                            if (result.alreadyOnBoat) {
                              check.alreadyOnBoat = true; // res.status(403).send('Could not Update Boat. Another Boat is already carrying that Cargo.').end();
                            }

                            if (typeof result === 'undefined') {
                              check.doesNotExist = true; // res.status(403).send('Could not Update Boat. This Cargo does not exist.').end();
                            }

                            return check;
                          });

                        case 2:
                          result = _context.sent;

                        case 3:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }));

                return function (_x6) {
                  return _ref2.apply(this, arguments);
                };
              }());
            }

            if (check.invalidName) {
              res.status(403).send('Could not Update Boat. A Boat with that name already exists.').end();
            } else if (check.alreadyOnBoat) {
              res.status(403).send('Could not Update Boat. Another Boat is already carrying that Cargo.').end();
            } else if (check.doesNotExist) {
              res.status(403).send('Could not Update Boat. This Cargo does not exist.').end();
            } else {
              boat = get_boat(req.params.id).then(function (boat) {
                var edittedBoat = update_boat(req, req.params.id, boat);
                var printedBoat = print_boat(req, req.params.id, edittedBoat);
                res.status(200).json(printedBoat);
              });
            }

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function (_x4, _x5) {
    return _ref.apply(this, arguments);
  };
}());
router.put('/:bid/cargo/:cid', function (req, res) {
  var check = check_cargoCarrier(req.params.cid).then(function (check) {
    if (check.alreadyOnBoat) {
      res.status(403).send('Could not put Cargo on Boat. That Cargo is on another Boat.').end();
    } else {
      put_cargoOnBoat(req.params.bid, req.params.cid).then().then(res.status(200).end());
    }
  });
});
router["delete"]('/:id', function (req, res) {
  var boat = get_boat(req.params.id).then(function (boat) {
    var boatToDelete = delete_boat(req.params.id, boat).then(function (boatToDelete) {
      res.status(204).end();
    });
  });
});
router["delete"]('/:bid/cargo/:cid', function (req, res) {
  remove_cargoFromBoat(req.params.bid, req.params.cid);
  res.status(204).end();
});
/* ------------- End Controller Functions ------------- */

module.exports = router;