/*
 * Simple signaling channel for WebRTC (use with channel_server.js).
 */
var UserId;
function SignalingChannel(sessionId) {
    if (!sessionId)
        sessionId = "123";
    userId = createId();
UserId = userId;
    var channels = {};

    var listeners = {
        "onpeer": null,
        "onsessionfull": null
    };
    for (var name in listeners)
        Object.defineProperty(this, name, createEventListenerDescriptor(name, listeners));

    function createId() {
        return Math.random().toString(16).substr(2);
        //这里获取用户id
    };

    var es = new EventSource("/openwebrtc/stoc/" + sessionId + "/" + userId);

    es.onerror = function () {
        es.close();
    };

    es.addEventListener("join", function (evt) {
        var peerUserId = evt.data;
        console.log("join: " + peerUserId);
        var channel = new PeerChannel(peerUserId);
        channels[peerUserId] = channel;

        es.addEventListener("user-" + peerUserId, userDataHandler, false);
        fireEvent({ "type": "peer", "peer": channel,"peerUserId":peerUserId }, listeners);
    }, false);

    function userDataHandler(evt) {
        var peerUserId = evt.type.substr(5); // discard "user-" part
        var channel = channels[peerUserId];
        if (channel)
            channel.didGetData(evt.data);
    }

    es.addEventListener("leave", function (evt) {
        var peerUserId = evt.data;

        es.removeEventListener("user-" + peerUserId, userDataHandler, false);

        channels[peerUserId].didLeave();
        delete channels[peerUserId];
    }, false);

    es.addEventListener("sessionfull", function () {
        fireEvent({"type": "sessionfull"}, listeners);
        es.close();
    }, false);

    function PeerChannel(peerUserId) {
        var listeners = {
            "onmessage": null,
            "ondisconnect": null
        };
        for (var name in listeners)
            Object.defineProperty(this, name, createEventListenerDescriptor(name, listeners));

        this.didGetData = function (data) {
            fireEvent({"type": "message", "data": data,"peerUserId":peerUserId }, listeners);
        };

        this.didLeave = function () {
            fireEvent({"type": "disconnect","peerUserId":peerUserId }, listeners);
        };

        var sendQueue = [];

        function processSendQueue() {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "/openwebrtc/ctos/" + sessionId + "/" + userId + "/" + peerUserId);
            xhr.setRequestHeader("Content-Type", "text/plain");
            xhr.send(sendQueue[0]);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == xhr.DONE) {
                    sendQueue.shift();
                    if (sendQueue.length > 0)
                        processSendQueue();
                }
            };
        }

        this.send = function (message) {
            if (sendQueue.push(message) == 1)
                processSendQueue();
        };
    }

    function createEventListenerDescriptor(name, listeners) {
        return {
            "get": function () { return listeners[name]; },
            "set": function (cb) { listeners[name] = cb instanceof Function ? cb : null; },
            "enumerable": true
        };
    }

    function fireEvent(evt, listeners) {
        var listener = listeners["on" + evt.type]
        if (listener)
            listener(evt);
    }
}
