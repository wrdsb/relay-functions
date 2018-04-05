module.exports = function (context, data) {
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
    ], function (err, results) {
        if (err) {
            context.done(err);
        } else {
            results = JSON.stringify(results);
            context.bindings.outBlob = results;
            context.log(results);
            context.res = {
                status: 200,
                body: results
            };
            context.done(null, results);
        }
    });
};