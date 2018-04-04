module.exports = function (context, eventGridEvent) {
    var Gremlin = require('gremlin');
    var async = require('async');

    const client = Gremlin.createClient(
        443,
        process.env[relayGraphURL],
        {
            "session": false,
            "ssl": true,
            "user": `/dbs/${process.env[relayGraphDatabase]}/colls/${process.env[relayGraphCollection]}`,
            "password": process.env[relayGraphPrimaryKey]
        }
    );

    context.log("JavaScript Event Grid function processed a request.");
    context.log("Subject: " + eventGridEvent.subject);
    context.log("Time: " + eventGridEvent.eventTime);
    context.log("Data: " + JSON.stringify(eventGridEvent.data));
    context.done();

    client.execute("g.V().count()", { }, (err, results) => {
        if (err) {
            console.log(err);
        }
        context.log("Result: %s\n", JSON.stringify(results));
    });
};