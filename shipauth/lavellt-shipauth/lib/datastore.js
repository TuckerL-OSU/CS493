const { Datastore } = require('@google-cloud/datastore');

const projectId = 'lavellt-shipauth';

module.exports.Datastore = Datastore;
module.exports.datastore = new Datastore({projectId:projectId});
module.exports.fromDatastore = function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
}
