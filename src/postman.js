(function() {
    window.postman = {};

    var clients = {};
    var callbacks = {};
    var timeoutHandlers = {};


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
     *
     * @param {Object=} opt_data
     * @return {Message}
     */
    Message.create = function(opt_data) {
        return new Message(opt_data || {});
    };


    /**
     *
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
        this.timeoutDuration = opt_timeout || 5000;

        clients[this.id] = this;
    }


    /**
     *
     * @param {Message} message
     */
    Client.prototype.sendMessage = function(message) {
        this.contentWindow.postMessage(message.toJSON(), this.domain);
    };


    /**
     *
     * @param {string} name
     * @param {?Object=} opt_data
     * @param {Function} opt_callback
     */
    Client.prototype.emit = function(name, opt_data, opt_callback) {
        var message = Message.create({
            type: 'req',
            name: name,
            payload: opt_data
        });

        if (opt_callback) {
            callbacks[message.id] = opt_callback;
            timeoutHandlers[message.id] = setTimeout(function() {
                var callback = callbacks[message.id];
                callback && callback(new Error('Timeout exceed.'));
                delete callbacks[message.id];
                delete timeoutHandlers[message.id];
            }, this.timeoutDuration);
        }

        this.sendMessage(message);
    };


    /**
     *
     * @param {string} name
     * @param {Function} handler
     */
    Client.prototype.on = function(name, handler) {
        this.handlers[name] = handler;
    };


    /**
     *
     * @param {Message} message
     */
    Client.prototype.handleMessage = function(message) {
        var that = this;
        var handler = this.handlers[message.name];

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
     * Listen for message events.
     */
    window.addEventListener('message', function(e) {
        var message = Message.parse(e);

        switch (message.type) {
            case 'req':
                for (var clientId in clients) {
                    var client = clients[clientId];
                    if (client.contentWindow == e.source)
                        client.handleMessage(message);
                }

                break;
            case 'res':
                var callback = callbacks[message.id];
                callback && callback(message.error, message.payload);

                if (timeoutHandlers[message.id])
                    clearTimeout(timeoutHandlers[message.id]);

                delete callbacks[message.id];
                break;
        }
    }, false)


    /**
     *
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
})();
