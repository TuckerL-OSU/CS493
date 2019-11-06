"use strict";

var _require = require('@google-cloud/datastore'),
    Datastore = _require.Datastore;

var projectId = 'lavellt-boatcargo';
module.exports.Datastore = Datastore;
module.exports.datastore = new Datastore({
  projectId: projectId
});

module.exports.fromDatastore = function fromDatastore(item) {
  item.id = item[Datastore.KEY].id;
  return item;
};