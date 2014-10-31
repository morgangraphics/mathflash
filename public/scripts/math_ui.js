//GLOBALS
//TO DO - NAMESPACE THIS STUFF
var room;
var socket = io.connect();
var chat = new Chat(socket);

var mathui = (function(){
    var name;
    function userInput(message){
        return $('<div/>', {
            text: message
        });
    }
    function systemInput(message){
        return $('<div/>', {
            html: message,
            'class': 'system'
        });
    }
    function handleInput (chat, socket) {
        //TO DO - Assign event to user input
        var answer = $('#send-message').val();
        var chatArea = $('#chat');
        var socket;
        

        //TO DO : Validate - If answer is a number and during a quiz computeStats, otherwise send message
        // chat.computeStats({
        //     question: '4+4',
        //     answer: answer,
        //     answered: '',
        //     correct: '',
        //     time: '20ms'
        // });
        chat.sendMessage({
            game: room,
            message: answer
        });
        chatArea.append(userInput(this.name + ': ' + answer)).scrollTop(chatArea.prop('scrollHeight'));

        $('#send-message').val('');
    }
    function handleProfile (){

    }

    return {
        userInput: userInput,
        systemInput: systemInput,
        handleInput: handleInput
    }
}());

var ioEvents = (function(){
    function joinResult(result){
        var game = result.game;
        var icon = $('.icons .active').html();

        $('#roomName').text(game);
        $('#avatar').html(icon);

    }
    function listGamesResult (games) {
        $('#games').empty();

        //TO DO: Append in one go NOT each time
        for(var i = 0, len = games.length; i < len; i++){
            $('#games').append(mathui.userInput(games[i]));
        }
    
        $('#games div').click(function() {
            chat.handleAction({ action: 'join', game: $(this).text() });
            $('#send-message').focus();
        });
    }
    function listNamesResult (names) {
        $('#guests').empty();
        
        //TO DO: Append in one go NOT each time
        for(var i = 0, len = names.length; i < len; i++){
            $('#guests').append(mathui.userInput(names[i]));
        }

    }
    function messageResult(message){
        $('#chat').append(mathui.systemInput(message.text));
    }
    function nameResult(result){
        if($('#step1').is(':visible')){
            if(result.success){
                mathui.name = result.name;
                console.log('You are now known as ' + result.name);
                //On Flash card choice - close modal.
            } else {
                console.log('It is NOT true, Fire Some Error Validation')
            }
        } else {
            var message = result.success? 'Welcome ' + result.name + '.' : result.message ;
            mathui.name = result.name;
            $('#chat').append(mathui.systemInput(message));
        }
    }
    function profileResult(result){
        console.log('result = ', result);
    }
    return {
        joinResult: joinResult,
        listGamesResult: listGamesResult,
        listNamesResult: listNamesResult,
        nameResult: nameResult,
        messageResult: messageResult,
        profileResult: profileResult
    }
}())


$(document).ready(function() {
    
    //I want to set up a translator class so we're not referencing stuff directly
    

    //TODO: When page is refreshed - Disconnect previous socket
    //socket.emit('disconnect');

    //DEV
    //var game = document.location.hash.replace('#', '');
    //chat.handleAction({ action: 'join', game: game });

    // ====== APP SETUP ====== //

        //SETUP SOCKET EVENT LISTENERS/EMMITERS
        socket.on('joinResult', ioEvents.joinResult);
        socket.on('listGamesResult', ioEvents.listGamesResult);
        socket.on('listNamesResult', ioEvents.listNamesResult);
        socket.on('message', ioEvents.messageResult);
        socket.on('nameResult', ioEvents.nameResult);
        socket.on('profileResult', ioEvents.profileResult);
    
        socket.on('listStats', function(stats){
            console.log(stats)
        })

        setInterval(function() {
            socket.emit('listGames');
        }, 1000);


    // ====== UI SETUP ====== //
        var validName;
        var i = 0;

        //SETP 1 - Choose A Game/ICON/NAME
            
            //Name
            $('#name').keyup(function(e){
                clearTimeout(validName);
                //TO DO - Validate Name (no Swears)
                var name = $.trim(this.value);
                validName = setTimeout(function(){
                    chat.handleAction({ action: 'name', name: name });
                }, 1000);
            });

            //Icon Controls
            $('.controls a').click(function(e){
                var t = e.currentTarget;
                var ul = $('ul.icons');
                var li = ul.children('li');
                var dir = t.hash.replace('#', '');
                var max = (li.length-2)*-134;
                var os = ul.position().left;
                
                var l = $('a.left');
                var r = $('a.right');

                e.preventDefault();
                
                if(dir === 'next' && !r.hasClass('disabled')){
                    dis = '-=134';
                    i++;
                    if(os === 0 && l.hasClass('disabled')){
                        l.removeClass('disabled');
                    }
                    if(os === max){
                        r.addClass('disabled');
                    }
                }else if (dir === 'back' && !l.hasClass('disabled')){
                    dis = '+=134';
                    i--;
                    if(os === max-134 && r.hasClass('disabled')){
                        r.removeClass('disabled');
                    }
                    if(os === -134){
                        l.addClass('disabled');
                    }
                }else{
                    return;
                }
                ul.animate({
                    left: dis
                });
                $(li).removeClass('active');
                $(li[i]).addClass('active');
            });

            //Game Selection
            $('.games a').click(function(e){
                var t = e.currentTarget;
                var game = t.hash.replace('#', '');
                e.preventDefault();
                var icon = $('.icons .active').html();
                $(game).addClass('active');

                room = game;

                //console.log('icon = ', icon)

                //Doubling up some functionality -
                chat.handleAction({ action: 'join', game: game });
                chat.handleAction({ action: 'profile', icon: icon });

                $('#step1').hide();
                $('#step2').show();
                
            });



        //STEP 2 - Game Room

            $('#send-message').focus();
        
            //Chat Bar
            $('#game-controls').submit(function(e) {
                mathui.handleInput(chat, socket);
                e.preventDefault();
            });

});