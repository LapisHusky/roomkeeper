/*
    This is mpp-client-xt but with the following changes:
    - Attempts to rejoin the channel every second if it fails to join initially, or if it gets banned and is put in test/awkward
    - Keeps a running average of the client's ping to MPP which can be seen through client.averagePing
    - Reconnect instantly instead of waiting longer after failed attempts
    - Added a find_ids method which gets an array of _ids from a list of _ids, a single _id, a full name, or a portion of the name
    - Uses a buffer for kickbanning to ensure that kickbans don't get cancelled as much
    - Automatically picks up the crown
    - Prevent the client from banning itself
*/

if(typeof module !== "undefined") {
	module.exports = Client;
	var WebSocket = require("ws");
	var EventEmitter = require("events").EventEmitter;
	var HttpsProxyAgent = require("https-proxy-agent");
	var SocksProxyAgent = require("socks-proxy-agent");
} else {
	this.Client = Client;
}


function mixin(obj1, obj2) {
	for(var i in obj2) {
		if(obj2.hasOwnProperty(i)) {
			obj1[i] = obj2[i];
		}
	}
};


function Client(uri, proxy) {
	EventEmitter.call(this);
	this.uri = uri || "wss://www.multiplayerpiano.com";
	this.proxy = proxy;
	this.ws = undefined;
	this.serverTimeOffset = 0;
	this.user = undefined;
	this.participantId = undefined;
	this.channel = undefined;
	this.ppl = {};
	this.connectionTime = undefined;
	this.connectionAttempts = 0;
	this.desiredChannelId = undefined;
	this.desiredChannelSettings = undefined;
	this.pingInterval = undefined;
	this.canConnect = false;
	this.noteBuffer = [];
	this.noteBufferTime = 0;
    this.noteFlushInterval = undefined;
    this.rejoinChannelInterval = undefined;
    this.averagePing = 0;
    this.totalPings = 0;
    this.tStart = undefined;
    this.kickbanBuffer = [];
    this.lastKickban = 0;
    this.kickbanInterval = undefined;

	this.bindEventListeners();

	this.emit("status", "(Offline mode)");
};

mixin(Client.prototype, EventEmitter.prototype);

Client.prototype.constructor = Client;

Client.prototype.isSupported = function() {
	return typeof WebSocket === "function";
};

Client.prototype.isConnected = function() {
	return this.isSupported() && this.ws && this.ws.readyState === WebSocket.OPEN;
};

Client.prototype.isConnecting = function() {
	return this.isSupported() && this.ws && this.ws.readyState === WebSocket.CONNECTING;
};

Client.prototype.start = function() {
	this.canConnect = true;
	this.connect();
};

Client.prototype.stop = function() {
	this.canConnect = false;
	this.ws.close();
};

Client.prototype.connect = function() {
	if(!this.canConnect || !this.isSupported() || this.isConnected() || this.isConnecting())
		return;
	this.emit("status", "Connecting...");
	if(typeof module !== "undefined") {
		// nodejsicle
		this.ws = new WebSocket(this.uri, {
			origin: "https://www.multiplayerpiano.com",
			agent: this.proxy ? this.proxy.startsWith("socks") ? new SocksProxyAgent(this.proxy) : new HttpsProxyAgent(this.proxy) : undefined
		});
	} else {
		// browseroni
		this.ws = new WebSocket(this.uri);
	}
	this.ws.binaryType = "arraybuffer";
	var self = this;
	this.ws.addEventListener("close", function(evt) {
		self.user = undefined;
		self.participantId = undefined;
		self.channel = undefined;
		self.setParticipants([]);
		clearInterval(self.pingInterval);
		clearInterval(self.noteFlushInterval);

		self.emit("disconnect");
		self.emit("status", "Offline mode");

		// reconnect!
		if(self.connectionTime) {
			self.connectionTime = undefined;
			self.connectionAttempts = 0;
		} else {
			++self.connectionAttempts;
		}
		self.connect();
	});
	this.ws.addEventListener("error", function(error) {
		self.emit("socketerror", error);
	});
	this.ws.addEventListener("open", function(evt) {
		self.connectionTime = Date.now();
        self.sendArray([{m: "hi"}]);
		self.pingInterval = setInterval(function() {
            self.tStart = Date.now();
            self.sendArray([{m: "t", e: Date.now()}]);
        }, 20000);
        self.tStart = Date.now();
        self.sendArray([{m: "t", e: Date.now()}]);
		self.noteBuffer = [];
		self.noteBufferTime = 0;
		self.noteFlushInterval = setInterval(function() {
			if(self.noteBufferTime && self.noteBuffer.length > 0) {
				self.sendArray([{m: "n", t: self.noteBufferTime + self.serverTimeOffset, n: self.noteBuffer}]);
				self.noteBufferTime = 0;
				self.noteBuffer = [];
			}
		}, 200);

		self.emit("connect");
		self.emit("status", "Joining channel...");
	});
	this.ws.addEventListener("message", function(evt) {
		self.emit("message", evt);
		if (typeof evt.data !== "string") return;
		try {
			var transmission = JSON.parse(evt.data);
			for(var i = 0; i < transmission.length; i++) {
				var msg = transmission[i];
				self.emit(msg.m, msg);
			}
		} catch(e) {
			self.emit("error", e);
		}
	});
};

Client.prototype.bindEventListeners = function() {
	var self = this;
	this.on("hi", function(msg) {
		self.user = msg.u;
		self.receiveServerTime(msg.t, msg.e || undefined);
		if(self.desiredChannelId) {
			self.setChannel();
		}
	});
	this.on("t", function(msg) {
        self.receiveServerTime(msg.t, msg.e || undefined);
        const runningAverageBase = self.totalPings * self.averagePing;
        const runningAverageAddition = Date.now() - self.tStart;
        self.totalPings++;
        self.averagePing = (runningAverageBase + runningAverageAddition) / self.totalPings;
	});
	this.on("ch", function(msg) {
        clearInterval(self.rejoinChannelInterval);
		if (msg.ch._id !== self.desiredChannel) {
            self.rejoinChannelInterval = setInterval(function() {
                self.setChannel();
            }, 1100);
        }
		self.channel = msg.ch;
		if(msg.p) self.participantId = msg.p;
        self.setParticipants(msg.ppl);
        if (msg.ch.crown === undefined) {
            self.crownAvailable = false;
        } else {
            self.crownAvailable = msg.ch.crown.participantId === undefined;
        }
        if (self.crownAvailable) {
            if (msg.ch.crown.userId === self.getOwnParticipant()._id) {
                self.sendArray([{m:'chown', id:self.getOwnParticipant().id}]);
            } else {
                if (!self.chownTimerStarted) {
                    self.chownTimerStarted = true;
                    setTimeout(function() {
                        self.chownCount = 0;
                        self.loopStealCrown();
                    }, 15000 - (Date.now() - msg.ch.crown.time) - self.serverTimeOffset);
                }
            }
        }
	});
	this.on("p", function(msg) {
		self.participantUpdate(msg);
		self.emit("participant update", self.findParticipantById(msg.id));
	});
	this.on("m", function(msg) {
		if(self.ppl.hasOwnProperty(msg.id)) {
			self.participantUpdate(msg);
		}
	});
	this.on("bye", function(msg) {
		self.removeParticipant(msg.p);
	});
};

Client.prototype.send = function(raw) {
	if(this.isConnected()) this.ws.send(raw);
};

Client.prototype.sendArray = function(arr) {
	this.send(JSON.stringify(arr));
};

Client.prototype.setChannel = function(id, set) {
	this.desiredChannelId = id || this.desiredChannelId || "lobby";
	this.desiredChannelSettings = set || this.desiredChannelSettings || undefined;
    this.sendArray([{m: "ch", _id: this.desiredChannelId, set: this.desiredChannelSettings}]);
    clearInterval(this.rejoinChannelInterval);
    this.rejoinChannelInterval = setInterval(function() {
        this.setChannel();
    }.bind(this), 1100);
};

Client.prototype.offlineChannelSettings = {
	lobby: true,
	visible: false,
	chat: false,
	crownsolo: false,
	color:"#ecfaed"
};

Client.prototype.getChannelSetting = function(key) {
	if(!this.isConnected() || !this.channel || !this.channel.settings) {
		return this.offlineChannelSettings[key];
	} 
	return this.channel.settings[key];
};

Client.prototype.offlineParticipant = {
	_id: "",
	name: "",
	color: "#777"
};

Client.prototype.getOwnParticipant = function() {
	return this.findParticipantById(this.participantId);
};

Client.prototype.setParticipants = function(ppl) {
	// remove participants who left
	for(var id in this.ppl) {
		if(!this.ppl.hasOwnProperty(id)) continue;
		var found = false;
		for(var j = 0; j < ppl.length; j++) {
			if(ppl[j].id === id) {
				found = true;
				break;
			}
		}
		if(!found) {
			this.removeParticipant(id);
		}
	}
	// update all
	for(var i = 0; i < ppl.length; i++) {
		this.participantUpdate(ppl[i]);
	}
};

Client.prototype.countParticipants = function() {
	var count = 0;
	for(var i in this.ppl) {
		if(this.ppl.hasOwnProperty(i)) ++count;
	}
	return count;
};

Client.prototype.participantUpdate = function(update) {
	var part = this.ppl[update.id] || null;
	if(part === null) {
		part = update;
		this.ppl[part.id] = part;
		this.emit("participant added", part);
		this.emit("count", this.countParticipants());
	} else {
		if(update.x) part.x = update.x;
		if(update.y) part.y = update.y;
		if(update.color) part.color = update.color;
		if(update.name) part.name = update.name;
	}
};

Client.prototype.removeParticipant = function(id) {
	if(this.ppl.hasOwnProperty(id)) {
		var part = this.ppl[id];
		delete this.ppl[id];
		this.emit("participant removed", part);
		this.emit("count", this.countParticipants());
	}
};

Client.prototype.findParticipantById = function(id) {
	return this.ppl[id] || this.offlineParticipant;
};

Client.prototype.find_ids = function(query) {
    query = query.toLowerCase();
    if (query.includes(' ')) {
        list = query.split(' ');
        isIdList = true;
        list.forEach(i => {
            if (!/^[0-9a-f]{24}$/.test(i)) isIdList = false;
        });
        if (isIdList) {
            return list;
        }
    } else {
        if (/^[0-9a-f]{24}$/.test(query)) return [query];
    }
    var matchedIds = [];
    Object.values(this.ppl).forEach(i => {
        if (i.name.toLowerCase() === query) matchedIds.push(i._id);
    });
    if (matchedIds.length > 0) {
        return matchedIds;
    }
    matchedIds = [];
    Object.values(this.ppl).forEach(i => {
        if (i.name.toLowerCase().includes(query)) matchedIds.push(i._id);
    });
    return matchedIds;
}

Client.prototype.isOwner = function() {
	return this.channel && this.channel.crown && this.channel.crown.participantId === this.participantId;
};

Client.prototype.preventsPlaying = function() {
	return this.isConnected() && !this.isOwner() && this.getChannelSetting("crownsolo") === true;
};

Client.prototype.receiveServerTime = function(time, echo) {
	var self = this;
	var now = Date.now();
	var target = time - now;
	//console.log("Target serverTimeOffset: " + target);
	var duration = 1000;
	var step = 0;
	var steps = 50;
	var step_ms = duration / steps;
	var difference = target - this.serverTimeOffset;
	var inc = difference / steps;
	var iv;
	iv = setInterval(function() {
		self.serverTimeOffset += inc;
		if(++step >= steps) {
			clearInterval(iv);
			//console.log("serverTimeOffset reached: " + self.serverTimeOffset);
			self.serverTimeOffset=target;
		}
	}, step_ms);
	// smoothen

	//this.serverTimeOffset = time - now;			// mostly time zone offset ... also the lags so todo smoothen this
								// not smooth:
	//if(echo) this.serverTimeOffset += echo - now;	// mostly round trip time offset
};

Client.prototype.startNote = function(note, vel) {
	if(this.isConnected()) {
		var vel = typeof vel === "undefined" ? undefined : +vel.toFixed(3);
		if(!this.noteBufferTime) {
			this.noteBufferTime = Date.now();
			this.noteBuffer.push({n: note, v: vel});
		} else {
			this.noteBuffer.push({d: Date.now() - this.noteBufferTime, n: note, v: vel});
		}
	}
};

Client.prototype.stopNote = function(note) {
	if(this.isConnected()) {
		if(!this.noteBufferTime) {
			this.noteBufferTime = Date.now();
			this.noteBuffer.push({n: note, s: 1});
		} else {
			this.noteBuffer.push({d: Date.now() - this.noteBufferTime, n: note, s: 1});
		}
	}
};



/* extended methods */

Client.prototype.say = function (message) {
	this.sendArray([{m: "a", message}]);
};

Client.prototype.userset = function (set) {
	this.sendArray([{m: "userset", set}]);
};

Client.prototype.setName = function (name) {
	this.userset({name});
};

Client.prototype.moveMouse = function (x, y) {
	this.sendArray([{m: "m", x, y}]);
};

Client.prototype.kickBan = function (_id, ms) {
    if (_id === this.getOwnParticipant()._id) return;
    if (Date.now() - this.lastKickban > 1200 && this.kickbanBuffer.length === 0) {
        this.sendArray([{m: "kickban", _id, ms}]);
        this.lastKickban = Date.now();
    } else {
        if (this.kickbanBuffer.length === 0) {
            this.kickbanInterval = setInterval(function() {
                this.sendArray([{m: "kickban", _id:this.kickbanBuffer[0]._id, ms:this.kickbanBuffer[0].ms}]);
                this.kickbanBuffer.unshift();
                this.lastKickban = Date.now();
                if (this.kickbanBuffer.length === 0) {
                    clearInterval(this.kickbanInterval);
                }
            }.bind(this), 1200);
        }
        if (!this.kickbanBuffer.map(i => i._id).includes(_id)) this.kickbanBuffer.push({_id, ms});
    }
};

Client.prototype.unban = function (_id) {
    this.sendArray([{m: "unban", _id}]);
};

Client.prototype.chown = function (id) {
	this.sendArray([{m: "chown", id}]);
};

Client.prototype.chset = function (set) {
	this.sendArray([{m: "chset", set}]);
};

Client.prototype.loopStealCrown = function () {
    this.sendArray([{m:'chown', id:this.getOwnParticipant().id}]);
    this.chownCount++;
    if (this.chownCount === 4) {
        this.crownAvailable = false;
    }
    if (this.crownAvailable) {
        setTimeout(function() {
            this.loopStealCrown();
        }.bind(this), 20);
    } else {
        this.chownTimerStarted = false;
    }
}

// ¯\_(ツ)_/¯
