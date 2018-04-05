module.exports = function (context, data) {
    var Gremlin = require('gremlin');

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
                context.log(JSON.stringify(event));
                //client.execute(`g.V().has('id', '${event_grid_event.eventType}').in()`, { }, (err, results) => {
                //client.execute(`g.V().has('id', '${event_grid_event.eventType}').out()`, { }, (err, results) => {
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