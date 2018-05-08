module.exports = function (context, triggerEvent) {
    var execution_timestamp = (new Date()).toJSON();  // format: 2012-04-23T18:25:43.511Z
    var events = [];

    var trigger_event = triggerEvent;  // incoming event object from trigger
    var relay_event;  // trigger event's type, fetched from Relay database
  
    var Gremlin = require('gremlin');
    var async = require('async');

    // TODO: validate trigger_event

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
            callback(null, client, trigger_event, relay_event);
        },
        function(client, trigger_event, relay_event, callback) {
            context.log(trigger_event);
            client.execute(`g.V().has('id', '${trigger_event.eventType}')`, { }, (err, results) => {
                if (err) {
                    callback(err);
                } else {
                    // TODO: handle missing/null vertex
                    relay_event = results;
                    context.log(JSON.stringify(results));
                    callback(null, client, trigger_event, relay_event);
                }
            });
        },
        function(client, trigger_event, relay_event, callback) {
            context.log(JSON.stringify(relay_event));
            client.execute(`g.V().has('id', '${trigger_event.eventType}').out()`, { }, (err, results) => {
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
        // TODO: if crankcase_job, JSON.parse crankcase_job
    ], function (err, result) {
        if (err) {
            context.done(err);
        } else {
            var event_type = "ca.wrdsb.relay.event.reactor";
            var flynn_event = {
                eventID: `${event_type}-${context.executionContext.invocationId}`,
                eventType: event_type,
                source: "",
                schemaURL: "ca.wrdsb.relay.event.reactor.json",
                extensions: {},
                data: {
                    function_name: context.executionContext.functionName,
                    invocation_id: context.executionContext.invocationId,
                    result: {
                    },
                },
                eventTime: execution_timestamp,
                eventTypeVersion: "0.1",
                cloudEventsVersion: "0.1",
                contentType: "application/json"
            };
            events.push(JSON.stringify(flynn_event));
            context.bindings.flynnGrid = events;
            context.done(null, result);
        }
    });
};