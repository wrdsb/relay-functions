module.exports = function (context, data) {
    var storage = require('azure-storage');
    var blobService = storage.createBlobService();
    var Gremlin = require('gremlin');
    var async = require('async');

    const client = Gremlin.createClient(
        443,
        process.env["relayGraphURL"],
        {
            "session": false,
            "ssl": true,
            "user": `/dbs/${process.env["relayGraphDatabase"]}/colls/${process.env["relayGraphCollection"]}`,
            "password": process.env["relayGraphPrimaryKey"]
        }
    );

    async.waterfall([
        function(callback) {
            callback(null, client);
        },
        function(client, callback) {
            client.execute('g.V()', { }, (err, results) => {
                if (err) {
                    callback(err);
                } else {
                    callback(null, results);
                }
            });
        },
        function(results, callback) {
            results.forEach(function(event) {
                client.execute(`g.V().has('id', '${event.eventType}').in()`, { }, (err, results) => {
                    if (err) {
                        callback(err);
                    } else {
                        event.triggered_by = results;
                    }
                });
                client.execute(`g.V().has('id', '${event.eventType}').out()`, { }, (err, results) => {
                    if (err) {
                        callback(err);
                    } else {
                        event.triggers = results;
                    }
                });
                context.log(JSON.stringify(event));
                callback(null, event);
            });
        }
    ], function (err, event) {
        if (err) {
            context.done(err);
        } else {
            context.done(null, event);
        }
    });
};