module.exports = function (context, eventGridEvent) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    var flynn_event;

    var Gremlin = require('gremlin');
    var async = require('async');

    var event_grid_event = eventGridEvent;
    var relay_event;

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
            callback(null, client, event_grid_event, relay_event);
        },
        function(client, event_grid_event, relay_event, callback) {
            context.log(event_grid_event);
            client.execute(`g.V().has('id', '${event_grid_event.eventType}')`, { }, (err, results) => {
                if (err) {
                    callback(err);
                } else {
                    // TODO: handle missing/null vertex
                    relay_event = results;
                    callback(null, client, event_grid_event, relay_event);
                }
            });
        },
        function(client, event_grid_event, relay_event, callback) {
            context.log(JSON.stringify(relay_event));
            client.execute(`g.V().has('id', '${event_grid_event.eventType}').out()`, { }, (err, results) => {
                if (err) {
                    callback(err);
                } else {
                    // TODO: handle missing/null edges
                    // TODO: handle array of events
                    context.log(JSON.stringify(results));
                    callback(null, relay_event);
                }
            });
        }
    ], function (err, result) {
        if (err) {
            context.done(err);
        } else {
            context.done(null, result);
        }
    });
};