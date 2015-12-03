postman.js
---

This library implements socket.io syntax over `window.postMessage` between top window and iframes. Written in plain javascript, no dependencies, minified file size is just 2 KB.

```
bower install postman-js
```

Usage
---
1. Include `postman.min.js` to both parent page and child page.
2. Create communication clients
```
var client = postman.createClient(targetWindow, targetOrigin, opt_timeout)`;
```
- targetWindow: Target window object.
- targetOrigin: String (https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- opt_timeout: Number in ms. Default 5000 ms.
3. Listen for events in parent page
```
client.on('some-event', function(data) {
    console.log(data); // => {some: 'data'}
});
client.on('some-other-event', function(data, done) {
    // ...
    // You can also send acknowledges back!
    done(null, {some: 'response'});
});
```
4. Emit events from iframes
```
client.emit('some-event', {some: 'data'});
client.emit('some-other-event', null, function(err, data) {
    console.log(data); // => {some: 'response'}
});
```
5. Or vice-versa.

Sample
---
**parent.html**
```
<script src="postman.min.js"></script>
<iframe id="iframe" src="child.html" sandbox="allow-scripts"></iframe>
<script>
    var iframe = document.getElementById('iframe');
    var client = postman.createClient(iframe1.contentWindow, '*');
    client.on('some-event', function(data, done) {
        // Do something with data
        done(null, {some: 'response'});
    });
</script>
```
**child.html**
```
<script src="postman.min.js"></script>
<script>
    var client = postman.createClient(window.top, '*');
    client.emit('some-event', {some: 'data'}, function(err, data) {
        if (err)
            return console.log('Some event error: ' + err);

        console.log('Some event data:', data);
    });
</script>
```


Building
---
```
gulp
```
