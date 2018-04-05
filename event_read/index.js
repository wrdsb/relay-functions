module.exports = function (context, data) {
    var Gremlin = require('gremlin');
    var async = require('async');

    var event = {};
    event.id = data.eventType;

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
            callback(null, client, event);
        },
        function(client, event, callback) {
            client.execute(`g.V().has('id', '${event.id}')`, { }, (err, results) => {
                if (err) {
                    callback(err);
                } else {
                    event = results[0];
                    context.log(event);
                    callback(null, client, event);
                }
            });
        },
        function(client, event, callback) {
            client.execute(`g.V().has('id', '${event.id}').in()`, { }, (err, results) => {
                if (err) {
                    callback(err);
                } else {
                    event.triggered_by = results[0];
                }
            });
            callback(null, client, event);
        },
        function(client, event, callback) {
            client.execute(`g.V().has('id', '${event.id}').out()`, { }, (err, results) => {
                if (err) {
                    callback(err);
                } else {
                    event.triggers = results[0];
                }
            });
            callback(null, event);
        }
    ], function (err, event) {
        if (err) {
            context.done(err);
        } else {
            context.log(event);
            context.done(null, event);
        }
    });
};