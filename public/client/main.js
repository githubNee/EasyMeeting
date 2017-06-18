/*var isMozilla = window.mozRTCPeerConnection && !window.webkitRTCPeerConnection;*/
if (!window.RTCPeerConnection) {
    window.RTCPeerConnection = window.webkitRTCPeerConnection;
}

var selfView;
var remoteView;
var viewContainer;
var callButton;
var audioCheckBox;
var videoCheckBox;
var audioOnlyView;
var signalingChannel;
var pcs = {};
var peers = {};
var localDescCreateds = {};
var localStream;
var chatDiv;
var chatText;
var chatButton;
var chatCheckBox;
var channels = {};
var sessionId = "123";

if (!window.hasOwnProperty("orientation"))
    window.orientation = -90;

var configuration = {
  "iceServers": [
  {
    "urls": "stun:mmt-stun.verkstad.net"
  },
  {
    "urls": "turn:mmt-turn.verkstad.net",
    "username": "webrtc",
    "credential": "secret"
  }
  ]
};
window.onload = function () {
    selfView = document.getElementById("self_view");
    viewContainer = document.getElementById("video-container");
    callButton = document.getElementById("call_but");
    //var joinButton = document.getElementById("join_but");
    audioCheckBox = false;
    videoCheckBox = true;
    audioOnlyView = document.getElementById("audio-only-container");
    chatText = document.getElementById("chat_txt");
    chatButton = document.getElementById("chat_but");
    chatDiv = document.getElementById("chat_div");
    chatCheckBox = true;



    //joinButton.disabled = !navigator.mediaDevices.getUserMedia;
    var joinFunc = function (session_id) {
        sessionId = session_id;
        // only chat
        if (!(videoCheckBox || audioCheckBox)) peerJoin();

        function peerJoin() {
            //这里是会议室id
            var sessionId = sessionId;
            signalingChannel = new SignalingChannel(sessionId);
            callButton.onclick = function () {
                axios.post('http://100.64.18.85:3000/call',{
                    peerUserId:UserId
                })
                    .then(function(res){

                    })
                    .catch(function(err){
                        console.log(err);
                    });
                for(var i in peers) {
                    if(peers.hasOwnProperty(i)) {
                        start(true,i);
                    }
                }
            };

            // another peer has joined our session
            signalingChannel.onpeer = function (evt) {
                callButton.disabled = false;
                peers[evt.peerUserId] = evt.peer;
                peers[evt.peerUserId].onmessage = handleMessage;
                peers[evt.peerUserId].ondisconnect = function (evt) {
                    callButton.disabled = true;
                    //remoteView.style.visibility = "hidden";
                    if (pcs[evt.peerUserId])
                        pcs[evt.peerUserId].close();
                    delete pcs[evt.peerUserId];
                };
            };
        }

        // video/audio with our without chat
        if (videoCheckBox || audioCheckBox) {
            // get a local stream
            navigator.mediaDevices.getUserMedia({ "audio": audioCheckBox,
                "video": videoCheckBox}).then(function (stream) {
                // .. show it in a self-view
                selfView.srcObject = stream;
                // .. and keep it to be sent later
                localStream = stream;


                chatButton.disabled = true;

                if (videoCheckBox)
                    selfView.style.visibility = "visible";
                else if (audioCheckBox && !(chatCheckBox))
                    audioOnlyView.style.visibility = "visible";

                peerJoin();
            }).catch(logError);
        }
    };
    //joinButton.onclick = joinFunc;
    joinFunc("123");
};

// handle signaling messages received from the other peer
function handleMessage(evt) {
    var message = JSON.parse(evt.data);

    if (!pcs[evt.peerUserId] && (message.sessionDescription || message.candidate)) {
        start(false, evt.peerUserId);
        axios.post('http://100.64.18.85:3000/getPeer',{
            peerUserId:UserId
        })
            .then(function(res){
                for(var i=0;i< res.data.length;i++) {
                    start(true, res.data[i]);
                }
            })
            .catch(function(err){
                console.log(err);
            });
    }

    if (message.sessionDescription) {
        pcs[evt.peerUserId].setRemoteDescription(new RTCSessionDescription({
            "sdp": SDP.generate(message.sessionDescription),
            "type": message.type
        }), function () {
            // if we received an offer, we need to create an answer
            if (pcs[evt.peerUserId].remoteDescription.type == "offer") {
                pcs[evt.peerUserId].createAnswer(localDescCreateds[evt.peerUserId], logError);
            }
        }, logError);
    } else if (!isNaN(message.orientation) ) {
        //var transform = "rotate(" + message.orientation + "deg)";
        //remoteView.style.transform = remoteView.style.webkitTransform = transform;
    } else {
        var d = message.candidate.candidateDescription;
        message.candidate.candidate = "candidate:" + [
            d.foundation,
            d.componentId,
            d.transport,
            d.priority,
            d.address,
            d.port,
            "typ",
            d.type,
            d.relatedAddress && ("raddr " + d.relatedAddress),
            d.relatedPort && ("rport " + d.relatedPort),
            d.tcpType && ("tcptype " + d.tcpType)
        ].filter(function (x) { return x; }).join(" ");
        pcs[evt.peerUserId].addIceCandidate(new RTCIceCandidate(message.candidate), function () {}, logError);
    }
}

// call start() to initiate
function start(isInitiator,peerUserId) {
    //callButton.disabled = true;
    pcs[peerUserId] = new RTCPeerConnection(configuration);

    // send any ice candidates to the other peer
    pcs[peerUserId].onicecandidate = function (evt) {
        if (evt.candidate) {
            var s = SDP.parse("m=application 0 NONE\r\na=" + evt.candidate.candidate + "\r\n");
            var candidateDescription = s.mediaDescriptions[0].ice.candidates[0];
            peers[peerUserId].send(JSON.stringify({
                "candidate": {
                    "candidateDescription": candidateDescription,
                    "sdpMLineIndex": evt.candidate.sdpMLineIndex
                }
            }, null, 2));
            console.log("candidate emitted: " + JSON.stringify(candidateDescription, null, 2));
        }
    };

    // start the chat
    if (chatCheckBox) {
        if (isInitiator) {
            channels[peerUserId] = pcs[peerUserId].createDataChannel("chat");
            setupChat();
        } else {
            pcs[peerUserId].ondatachannel = function (evt) {
                channels[peerUserId] = evt.channel;
                setupChat();
            };
        }
    }

    // once the remote stream arrives, show it in the remote video element
    pcs[peerUserId].onaddstream = function (evt) {
        remoteView = document.getElementById("video-" + peerUserId);
        if(remoteView === null) {
            remoteView = document.createElement("video");
            remoteView.setAttribute("class", "shadow owr-overlay-video");
            remoteView.setAttribute("autoplay", "true");
            remoteView.id = "video-" + peerUserId;
            viewContainer.appendChild(remoteView);
        }
        remoteView.srcObject = evt.stream;
        if (videoCheckBox)
            remoteView.style.visibility = "visible";
        else if (audioCheckBox && !(chatCheckBox))
            audioOnlyView.style.visibility = "visible";
        sendOrientationUpdate(peers[peerUserId]);
    };

    if (audioCheckBox || videoCheckBox) {
        pcs[peerUserId].addStream(localStream);
    }
    localDescCreateds[peerUserId] = function localDescCreated(desc) {
        pcs[peerUserId].setLocalDescription(desc, function () {
            var sessionDescription = SDP.parse(pcs[peerUserId].localDescription.sdp);
            peers[peerUserId].send(JSON.stringify({
                "sessionDescription": sessionDescription,
                "type": pcs[peerUserId].localDescription.type
            }, null, 2));
            var logMessage = "localDescription set and sent to peer, type: " + pcs[peerUserId].localDescription.type
                + ", sessionDescription:\n" + JSON.stringify(sessionDescription, null, 2);
            console.log(logMessage);
        }, logError);
    };
    if (isInitiator) {
        pcs[peerUserId].createOffer(localDescCreateds[peerUserId], logError);
    }
}

function localDescCreated(desc) {
    pc.setLocalDescription(desc, function () {
        var sessionDescription = SDP.parse(pc.localDescription.sdp);
        peer.send(JSON.stringify({
            "sessionDescription": sessionDescription,
            "type": pc.localDescription.type
        }, null, 2));
        var logMessage = "localDescription set and sent to peer, type: " + pc.localDescription.type
            + ", sessionDescription:\n" + JSON.stringify(sessionDescription, null, 2);
        console.log(logMessage);
    }, logError);
}

function sendOrientationUpdate(peer) {
    peer.send(JSON.stringify({ "orientation": window.orientation + 90 }));
}

window.onorientationchange = function () {
    for(var i in peers){
        if (peers.hasOwnProperty(i)) { //filter,只输出man的私有属性
            sendOrientationUpdate(peers[i]);
        }
    }
    if (selfView) {
        var transform = "rotate(" + (window.orientation + 90) + "deg)";
        selfView.style.transform = selfView.style.webkitTransform = transform;
    }
};

function logError(error) {
    if (error) {
        if (error.name && error.message)
            log(error.name + ": " + error.message);
        else
            log(error);
    } else
        log("Error (no error message)");
}

function log(msg) {
    log.div = log.div || document.getElementById("log_div");
    log.div.appendChild(document.createTextNode(msg));
    log.div.appendChild(document.createElement("br"));
}

// setup chat
function setupChat() {
    chatButton.onclick = function () {
        if (chatText.value) {

            postChatMessage(chatText.value, true);
            for(var k in channels) {
                if(channels.hasOwnProperty(k))
                channels[k].send(chatText.value);
            }
            chatText.value = "";
            chatText.placeholder = "";
        }
    };
    for(var i in channels) {
        if (channels.hasOwnProperty(i)) {
            peerUserId = i;
            channels[peerUserId].onopen = function () {
                chatDiv.style.visibility = "visible";
                chatText.style.visibility = "visible";
                chatButton.style.visibility = "visible";
                chatButton.disabled = false;

                //On enter press - send text message.
                chatText.onkeyup = function (event) {
                    if (event.keyCode == 13) {
                        chatButton.click();
                    }
                };


            };

            // recieve data from remote user
            channels[peerUserId].onmessage = function (evt) {
                postChatMessage(evt.data);
            };

            function postChatMessage(msg, author) {
                var messageNode = document.createElement('div');
                var messageContent = document.createElement('div');
                messageNode.classList.add('chatMessage');
                messageContent.textContent = msg;
                messageNode.appendChild(messageContent);

                if (author) {
                    messageNode.classList.add('selfMessage');
                } else {
                    messageNode.classList.add('remoteMessage');
                }

                chatDiv.appendChild(messageNode);
                chatDiv.scrollTop = chatDiv.scrollHeight;
            }
        }
    }
}
