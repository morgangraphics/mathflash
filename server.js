var mathflash = (function () {
    var http = require('http');
    var fs = require('fs');
    var path = require('path');
    var mime = require('mime');
    var cache = {};
    var server = _createNodeServer();
    var mathServer = require('./lib/math_server');


    function _createNodeServer () {
        return http.createServer(function (request, response) {
                var filepath = (request.url === '/' ? 'public/index.html' : 'public' + request.url);
                var abspath = './' + filepath;
                serveFile({
                  response: response,
                  cache: cache,
                  filepath: abspath
                });
            });
    }
    

    /*
        Start the Node Server
    **/
    server.listen(3000, function () {
        console.log('Server is running on port 3000');
    });
    /*
        Start the Chat Server
    **/
    mathServer.listen(server);


    /*

    **/
    function send404 (response) {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.write('Error: Resource not found :( ');
        response.end();
    }

    /*

    **/
    function sendFile (obj) {
        var filepath = mime.lookup(path.basename(obj.filepath));
        obj.response.writeHead(200, {"content-type": filepath});
        obj.response.end(obj.data);
    }

    /*

    **/
    function serveFile (obj) {
        //if (cache[obj.filepath]) {
        //    sendFile({
        //        data: cache[obj.filepath],
        //        filepath: obj.filepath,
        //        response: obj.response
        //    });
        //} else {
            fs.exists(obj.filepath, function(exists){
                if (exists) {
                    fs.readFile(obj.filepath, function(err, data) {
                        if (err) {
                            send404(obj.response);
                        } else {
                            cache[obj.filepath] = data;
                            sendFile({
                                response: obj.response,
                                filepath: obj.filepath,
                                data: data
                            });
                        }
                    });
                } else {
                    send404(obj.response);
                }

            });
        //}
    }
    return {
        cache: cache,
        send404: send404,
        sendFile: sendFile,
        serveFile: serveFile
    }

}());