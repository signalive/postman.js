(function() {

    var postman = {};
    var clients = {};


    /**
     * Creates a client.
     * @param {Window} contentWindow
     * @param {string} domain
     * @param {number=} opt_timeout
     * @return {Client}
     */
    postman.createClient = function(contentWindow, domain, opt_timeout) {
        return new Client(contentWindow, domain, opt_timeout);
    };


    /**
     * Gets a client with content window.
     * @param {Window} contentWindow
     * @return {?Client}
     */
    postman.getClientByWindow = function(contentWindow) {
        var client;

        for (var clientId in clients) {
            if (clients[clientId].contentWindow == contentWindow)
                client = clients[clientId];
        }

        return client;
    };


    /**
     * @constructor
     * @param {Object=} data
     */
    function Message(data) {
        data = data || {};
        this.id = data.id || generateId_();
        this.type = data.type; // req or res
        this.name = data.name;
        this.error = data.error;
        this.payload = data.payload;
    }


    /**
     * Creates a message.
     * @param {Object=} opt_data
     * @return {Message}
     */
    Message.create = function(opt_data) {
        return new Message(opt_data || {});
    };


    /**
     * Creates message from event object.
     * @param {Event} e
     * @return {Message}
     */
    Message.parse = function(e) {
        var data = JSON.parse(e.data);
        return new Message(data);
    };


    /**
     * @return {Object}
     */
    Message.prototype.toJSON = function() {
        var json = {
            id: this.id,
            type: this.type,
            name: this.name,
            error: this.error,
            payload: this.payload
        };

        // TODO: _.pick

        return JSON.stringify(json);
    };


    /**
     * @constructor
     * @param {Window} contentWindow
     * @param {string} domain
     * @param {number=} opt_timeout
     */
    function Client(contentWindow, domain, opt_timeout) {
        this.id = generateId_();

        this.contentWindow = contentWindow;
        this.domain = domain;
        this.handlers = {};
        this.timeoutDuration = opt_timeout;

        if (!this.timeoutDuration && this.timeoutDuration !== 0)
            this.timeoutDuration = 10000;

        this.callbacks = {};
        this.timeoutHandlers = {};

        clients[this.id] = this;
    }


    /**
     * Main send message method.
     * @param {Message} message
     */
    Client.prototype.sendMessage = function(message) {
        this.contentWindow.postMessage(message.toJSON(), this.domain);
    };


    /**
     * Emits.
     * @param {string} name
     * @param {?Object=} opt_data
     * @param {Function} opt_callback
     */
    Client.prototype.emit = function(name, opt_data, opt_callback) {
        var that = this;

        var message = Message.create({
            type: 'req',
            name: name,
            payload: opt_data
        });

        if (opt_callback) {
            this.callbacks[message.id] = opt_callback;

            if (this.timeoutDuration > 0) {
                this.timeoutHandlers[message.id] = setTimeout(function() {
                    var callback = that.callbacks[message.id];
                    callback && callback(new Error('Timeout exceed.'));
                    delete that.callbacks[message.id];
                    delete that.timeoutHandlers[message.id];
                }, this.timeoutDuration);
            }
        }

        this.sendMessage(message);
    };


    /**
     * Binds a handler to event.
     * @param {string} name
     * @param {Function} handler
     */
    Client.prototype.on = function(name, handler) {
        this.handlers[name] = handler;
    };


    /**
     * Handles request. Passes request message to handler if exists.
     * @param {Message} message
     */
    Client.prototype.handleRequest = function(message) {
        var that = this;
        var handler = this.handlers[message.name];

        if (!handler)
            return;

        var callback = function(err, data) {
            var responseMessage = Message.create({
                id: message.id,
                name: message.name,
                type: 'res',
                error: err,
                payload: data
            });

            that.sendMessage(responseMessage);
        };

        handler && handler(message.payload, callback);
    };


    /**
     * Handles response. Clears timeout and executes callback.
     * @param {Message} message
     */
    Client.prototype.handleResponse = function(message) {
        var callback = this.callbacks[message.id];
        callback && callback(message.error, message.payload);

        if (this.timeoutHandlers[message.id])
            clearTimeout(this.timeoutHandlers[message.id]);

        delete this.callbacks[message.id];
    };


    /**
     * Gracefully destorys itself.
     */
    Client.prototype.destroy = function() {
        // Delete timeout handlers.
        for (var messageId in this.timeoutHandlers) {
            clearTimeout(this.timeoutHandlers[messageId]);
        }

        // Fail callback
        for (var messageId in this.callbacks) {
            this.callbacks[messageId](new Error('Postman client has destoyed.'));
        }

        delete clients[this.id];
    };


    /**
     * Listen for message events.
     */
    window.addEventListener('message', function(e) {
        try {
            var message = Message.parse(e);
            var client = postman.getClientByWindow(e.source);

            if (!client)
                return;

            switch (message.type) {
                case 'req':
                    client.handleRequest(message);
                    break;
                case 'res':
                    client.handleResponse(message);
                    break;
            }
        } catch(err) {
            // Don't do anything
        }
    }, false)


    /**
     * Generate randon string, default length is 6.
     * @param {number=} opt_length
     * @return {string}
     */
    function generateId_(opt_length) {
        var chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz',
            string = '';

        opt_length = opt_length || 6;

        for (var i = 0; i < opt_length; i++) {
            var randomNumber = Math.floor(Math.random() * chars.length);
            string += chars.substring(randomNumber, randomNumber + 1);
        }

        return string;
    }

    if (typeof module !== 'undefined') module.exports = postman;
    if (typeof window !== 'undefined') window.postman = postman;
})();
