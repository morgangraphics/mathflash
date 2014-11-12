var mathServer = (function () {
    var socketio = require('socket.io');
    var _ = require('underscore');
    var io;
    var inc = 1;
    var time = 2;
    var names = [];
    var currentGame = {};
    var users = {}
    var game_defaults = {
        rounds: {
            count:0,
            current: {}
        },
        startGame: '',
        timer: '',
        users: [],
    }
    var user_defaults = {
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
        var user = users[socket.id] = _.clone(user_defaults);

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
        socket.on('message', function (message) {
            var user = users[socket.id];
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
                        user = users[socket.id] = _.clone(user_defaults);

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
            var cg = currentGame[game] = _.clone(game_defaults);
            cg.startGame = new Date();
            //cg.rounds.count = cg.rounds.count++
            //console.log('timer = ', new _timer());
        }
        
        var usersInGame = currentGame[game].users.length;

        //TO DO: Change to 25 - If room contains more than 25 people, create a new room
        if(usersInGame > 5){
            game = game + suffixes[Math.floor((Math.random() * suffixes.length) - 1)];
            currentGame[game] = _.clone(game_defaults);
        }

        // Joining Room/Game
        socket.join(game);
        currentGame[game].users.push(id);

        socket.emit('joinResult', { 
            game: game,

        });

        socket.broadcast.to(game).emit('message', {
            text: statusMsg('justJoined', [name, game])
        });


    }
    function leaveGame (socket) {
        var socket = socket;
        var user = users[socket.id];
        
        for(var game in currentGame){
            var cg = currentGame[game];
            var index = cg.users.indexOf(socket.id);
            if(index >= 0){
                currentGame[game].users.splice(index, 1);
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
                if(currentGame[game].users.length === 0){ delete currentGame[game]; }
                gameList.push(game);
            }
            socket.emit('listGamesResult', gameList);
        })
    }

    function listNames (socket, game) {
        var userList = [];

        usersInGame = io.sockets.clients(game);

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

    function startGame () {
        //currentGame
    }



    /* HELPER FUNCTIONS */
    function statusMsg(message, params){
        var m = ((messages[message])? messages[message] : message );
        var p = ((params !== 'undefined' && !_.isArray(params))? p[params] : params)
        for(var i = 0, len = p.length; i < len; i++){
            m = m.replace(new RegExp("\\{"+i+"\\}", "g"), p[i]);
        }
        return m;
    }

    function _timer(){
        var time = 1;
        return function(){
            setInterval(function(){
                var min = Math.floor(time/60);
                var sect = time%60;
                var sec = ((sect <= 9)? '0'+ sect : sect);
                if(min === 0 && sec === 0){
                    //trigger new round
                    console.log('new round begins')
                }
                time = time - 1;
                console.log(min, sec);
                //return {min: min, sec: sec}
            },1000);
        }
    }

    


}());