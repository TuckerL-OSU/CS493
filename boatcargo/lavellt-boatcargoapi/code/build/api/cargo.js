"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var express = require('express');

var bodyParser = require('body-parser');

var router = express.Router();

var ds = require('../lib/datastore');

var datastore = ds.datastore;
var CARGO = "Cargo";
var BOAT = "Boat";
router.use(bodyParser.json());

function print_cargo(_x, _x2, _x3) {
  return _print_cargo.apply(this, arguments);
} // kind of working
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


function _print_cargo() {
  _print_cargo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(req, id, cargo) {
    var boat;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!(typeof cargo.carrier !== 'undefined')) {
              _context3.next = 5;
              break;
            }

            _context3.next = 3;
            return get_boat(cargo.carrier.id).then(function (boat) {
              cargo.carrier.name = boat.name;
              return boat;
            });

          case 3:
            boat = _context3.sent;
            cargo.carrier.self = req.protocol + "://" + req.get("host") + "/boats/" + cargo.carrier.id;

          case 5:
            cargo.id = id;
            cargo.self = req.protocol + "://" + req.get("host") + "/cargo/" + id;
            return _context3.abrupt("return", cargo);

          case 8:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _print_cargo.apply(this, arguments);
}

function get_boat(id) {
  // var result = {};
  var b_key = datastore.key([BOAT, parseInt(id, 10)]);
  return datastore.get(b_key).then(function (boat) {
    return boat[0];
  });
}
/* ------------- Begin guest Model Functions ------------- */


function post_cargo(weight, content, delivery_date) {
  var key = datastore.key(CARGO);
  var new_cargo = {
    "weight": weight,
    "content": content,
    "delivery_date": delivery_date
  };
  return datastore.save({
    "key": key,
    "data": new_cargo
  }).then(function () {
    return key;
  });
} // async function get_all_cargo(req) {
// const c_key = datastore.key([CARGO, parseInt(sid, 10)]);
// const new_date = (new Date()).toString();
// const query = datastore.createQuery(CARGO).filter('id', '=', sid);
// const result = await datastore.runQuery(query);
// const slip_num = result[0].number;
// const updated_slip = {"number": slip_num, "current_boat": bid, "arrival_date": new_date};
// return datastore.update({"key": s_key, "data": updated_slip});
// }
// WORKING


function get_all_cargo(_x4) {
  return _get_all_cargo.apply(this, arguments);
}

function _get_all_cargo() {
  _get_all_cargo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee5(req) {
    var q, results;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            q = datastore.createQuery(CARGO).limit(3);
            results = {};

            if (Object.keys(req.query).includes("cursor")) {
              console.log(req.query);
              q = q.start(req.query.cursor);
            }

            return _context5.abrupt("return", datastore.runQuery(q).then(function (entities) {
              console.log(entities);
              results.cargo = entities[0].map(ds.fromDatastore);
              results.cargo.forEach(
              /*#__PURE__*/
              function () {
                var _ref3 = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee4(result) {
                  var b_key;
                  return regeneratorRuntime.wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          // var formatted = print_cargo(req, result.id, result);
                          // .then( (formatted) => {
                          // return formatted;
                          // })
                          if (typeof result.carrier !== 'undefined') {
                            b_key = datastore.key([BOAT, parseInt(result.carrier.id, 10)]); // result.carrier.name = 
                            // });
                            // datastore.save({"key": b_key, "data": boat});

                            datastore.get(b_key).then(function (boat) {
                              result.carrier.name = boat.name;
                            }); // const boat = get_boat(result.carrier.id)
                            // .then(async (boat) => {
                            // result.carrier.name = await boat.name;
                            // return boat.name;
                            // });
                            // result.carrier.name = boat.name;

                            result.carrier.self = req.protocol + "://" + req.get("host") + "/boats/" + result.carrier.id; // result.carrier = cargoCarrier;
                          }

                          result.self = req.protocol + "://" + req.get("host") + "/cargo/" + result.id; // results.cargo = formatted;

                        case 2:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee4);
                }));

                return function (_x7) {
                  return _ref3.apply(this, arguments);
                };
              }());

              if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
                results.next = req.protocol + "://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
              }

              return results;
            }));

          case 4:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _get_all_cargo.apply(this, arguments);
}

function get_cargo(id) {
  // var result = {};
  var c_key = datastore.key([CARGO, parseInt(id, 10)]);
  return datastore.get(c_key).then(function (cargo) {
    return cargo[0];
  });
} // function get_cargo(req, id) {
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
  var edit = req.body; // var edittedBoat;

  console.log(edit); // edittedBoat = boat;

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
  } // strip editted of self links
  // if (typeof(boat.cargo) !== 'undefined') {
  // boat.cargo.forEach((cargo) => {
  // edittedBoat.cargo.push(cargo);
  // });
  // }
  // if (typeof(edittedBoat.self) !== 'undefined') {
  // delete edittedBoat.self;
  // }


  datastore.save(cargo)["catch"](function (err) {
    console.error('ERROR:', err);
  });
  return cargo;
} // ??


function put_guest(id, name) {
  var key = datastore.key([CARGO, parseInt(id, 10)]);
  var cargo = {
    "name": name
  };
  return datastore.save({
    "key": key,
    "data": cargo
  });
}

function delete_cargo(id, cargo) {
  if (typeof cargo.carrier !== 'undefined') {
    var boat = get_boat(cargo.carrier.id).then(
    /*#__PURE__*/
    function () {
      var _ref = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(boat) {
        var b_key;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return datastore.key([BOAT, parseInt(cargo.carrier.id, 10)]);

              case 2:
                b_key = _context.sent;
                boat.cargo.forEach(function (item) {
                  if (item == id) {
                    if (boat.cargo.length > 1) {
                      boat.cargo.splice(boat.cargo.indexOf(cargo.id), 1);
                    } else {
                      delete boat.cargo;
                    }
                  }
                });
                datastore.save({
                  "key": b_key,
                  "data": boat
                });

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function (_x5) {
        return _ref.apply(this, arguments);
      };
    }());
  }

  return datastore["delete"](datastore.key([CARGO, parseInt(id, 10)])); // const key = datastore.key([CARGO, parseInt(id, 10)]);
  // return datastore.delete(key);
}
/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */


router.get('/', function (req, res) {
  var cargo = get_all_cargo(req).then(function (cargo) {
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

router.get('/:id', function (req, res) {
  var cargo = get_cargo(req.params.id).then(function (cargo) {
    if (!cargo) {
      res.status(404).send("Cargo not found.").end();
    } else {
      var printedCargo = print_cargo(req, req.params.id, cargo).then(function (printedCargo) {
        res.status(200).json(printedCargo);
      });
    }
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

router.post('/', function (req, res) {
  console.log(req.body);
  post_cargo(req.body.weight, req.body.content, req.body.delivery_date).then(function (key) {
    res.status(200).send('{ "id": ' + key.id + ' }');
  });
});
router.put('/:id', function (req, res) {
  put_guest(req.params.id, req.body.name).then(res.status(200).end());
});
router["delete"]('/:id', function (req, res) {
  var cargo = get_cargo(req.params.id).then(function (cargo) {
    var cargoToDelete = delete_cargo(req.params.id, cargo); // .then( (cargoToDelete) => {
    // res.status(204).end();
    // });

    res.status(204).end();
  });
});
router.patch('/:id', function (req, res) {
  var cargo = get_cargo(req.params.id).then(
  /*#__PURE__*/
  function () {
    var _ref2 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2(cargo) {
      var edittedCargo, printedCargo;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              edittedCargo = update_cargo(req, cargo);
              _context2.next = 3;
              return print_cargo(req, req.params.id, edittedCargo);

            case 3:
              printedCargo = _context2.sent;
              res.status(200).json(printedCargo);

            case 5:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function (_x6) {
      return _ref2.apply(this, arguments);
    };
  }());
}); // router.delete('/:id', function(req, res){
// delete_cargo(req.params.id).then(res.status(200).end());
// });

/* ------------- End Controller Functions ------------- */

module.exports = router;