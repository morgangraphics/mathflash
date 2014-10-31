var mathServer = (function () {
    var socketio = require('socket.io');
    var _ = require('underscore');
    var io;
    var inc = 1;
    var names = [];
    var currentGame = {};
    var users = {}
    var defaults = {
        icon: '',
        name: '',
        startGame: '',
        questions: {
            shown: '',
            answered: '',
            answers: []
        }
    }
    var messages = {
        formerName: '{0} is now known as {1}',
        justJoined: '{0} has just joined {1}',
        justLeft: '{0} has just left {1}',
        nameInUse: 'Name already in use.',
        noGuest: 'Name cannot begin with "Guest".'
    }
    var suffixes = [
        '-a-sarus',
        '-geddon',
        '-liscious'
    ]

    exports.listen = function(server) {
        io = socketio.listen(server);
        io.set('log level', 1);

        io.sockets.on('connection', function(socket){

            //assignGuestName({
            //    socket: socket,
            //    inc: inc,
            //    users: users,
            //    names: names
            //});

            handleBroadcast({
                socket: socket,
                users: users
            });

            handleDisconnect({
                socket: socket,
            });

            handleJoinGame(socket);

            handleNameChange({
                socket: socket,
            });

            handleStats({
                socket: socket,
            });

            handleProfile(socket);

            listGames(socket);
        });

    }

    function assignGuestName(obj) {
        var name = 'Guest_' + inc;
        var socket = obj;
        var user = users[socket.id] = _.clone(defaults);

        //Stats Setup
        user.name = name;
        user.startGame = new Date();

        socket.emit('nameResult', {
            success: true,
            name: name
        });

        names.push(name);
        return inc++;
    }
    function handleBroadcast (obj) {
        var socket = obj.socket;
        var user = users[socket.id];
        socket.on('message', function (message) {
            socket.broadcast.to(message.room).emit('message', {
                text: user.name + ': ' + message.text
            });
        });
    }
    function handleDisconnect (obj) {
        var socket = obj.socket;
        var user = users[socket.id];
        socket.on('disconnect', function(room) {
            if(user){
                var formerIndex = names.indexOf(user.name);
                //Delete only works well with objects, splice works with Arrays
                names.splice(formerIndex, 1);
                //TODO - Might want to save this data to a DB?
                delete user;
            }
        });
    }
    function handleJoinGame (socket) {
        socket.on('join', function(obj){
            leaveGame(socket);
            joinGame(socket, obj.game);
            listNames(socket, obj.game);
        });
    }
    function handleNameChange (obj) {
        var socket = obj.socket;
        var user = users[socket.id];
        socket.on('changeName', function(name){
            
            if (name.indexOf('Guest') === 0) {
                socket.emit('nameResult', {
                    success: false,
                    message: messages.noGuest
                });
            }else{
                if (names.indexOf(name) === -1) {

                    if(!user){
                        user = users[socket.id] = _.clone(defaults);

                        //Stats Setup
                        user.name = name;
                        names.push(name);
                        socket.emit('nameResult', {
                            success: true,
                            name: name
                        });

                        
                    } else {
                        var formerName = user.name;
                        var formerIndex = names.indexOf(formerName);

                        names.push(name);
                        user.name = name;
                        names.splice(formerIndex, 1);

                        socket.emit('nameResult', {
                            success: true,
                            name: name
                        });

                        socket.broadcast.to(currentGame[socket.id]).emit('message',{
                            text: statusMsg('formerName')
                        });
                    }

                } else {
                    socket.emit('nameResult', {
                        success: false,
                        message: statusMsg('nameInUse')
                    })
                }
                
            }
        });
    }
    function handleProfile(socket){
        //We need so way to maintain profile information bewteen the front and back
        socket.on('updateProfile', function(obj){
            var user = users[socket.id];

            var profile = _.extend(user, obj);
            
            
            socket.emit('profileResult', profile);
        })

        
    }
    function handleStats(obj){
        var socket = obj.socket;
        var users = obj.users;

        socket.on('stats', function(obj){
            var stats = _.extend(users[socket.id], obj.stats);

            socket.emit('stats', {
                stats: stats
            });
        });
    }
    function joinGame (socket, game) {
        var socket = socket;
        var id = socket.id;
        var user = users[id];
        var name = ((!user)? assignGuestName(socket) : user.name );

        if(!currentGame[game]){ 
            currentGame[game] = [];
        }
        
        var usersInGame = currentGame[game].length;

        //TO DO: Change to 25
        if(usersInGame > 5){
            game = game + suffixes[Math.floor((Math.random() * suffixes.length) - 1)];
            currentGame[game] = [];
        }

        // Joining Room/Game
        socket.join(game);
        currentGame[game].push(id);

        socket.emit('joinResult', { game: game });

        socket.broadcast.to(game).emit('message', {
            text: statusMsg('justJoined', [name, game])
        });


    }
    function leaveGame (socket) {
        var socket = socket;
        var user = users[socket.id];
        
        for(var game in currentGame){
            var cg = currentGame[game];
            var index = cg.indexOf(socket.id);
            if(index >= 0){
                currentGame[game].splice(index, 1);
                socket.leave(game);

                socket.broadcast.to(game).emit('message', {
                    text: statusMsg('justLeft', [user.name, game])
                });

                listNames(socket, game);
            }
        }
    }
    
    function listGames (socket) {

        socket.on('listGames', function(obj){
            var gameList = [];
            for(var game in currentGame){
                //Run some cleanup;
                if(currentGame[game].length === 0){ delete currentGame[game]; }
                gameList.push(game);
            }

            socket.emit('listGamesResult', gameList);
        })

    }

    function listNames (socket, game) {
        var userList = [];

        //console.log('socket = ', socket);
        //console.log('game = ', game);

        usersInGame = io.sockets.clients(game);

        //console.log('users = ', users);
        //console.log('usersIG = ', usersInGame);
        //console.log('Current gameId = ', currentGame[game])

        if(usersInGame.length > 0){
            //gamerSummary = "Gamers currently in " + game + ': ';
            _.each(usersInGame, function(gamer, i){
                 var id = gamer.id
                 var user = users[id]; 
                 userList.push(user.name);
            });

            userList.sort();
        }

        socket.emit('listNamesResult', userList);
        socket.broadcast.to(game).emit('listNamesResult', userList);
    }

    function statusMsg(message, params){
        var m = ((messages[message])? messages[message] : message );
        var p = ((params !== 'undefined' && !_.isArray(params))? p[params] : params)
        for(var i = 0, len = p.length; i < len; i++){
            m = m.replace(new RegExp("\\{"+i+"\\}", "g"), p[i]);
        }
        return m;
    }

    


}());