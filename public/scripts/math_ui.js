var room;
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

    return {
        userInput: userInput,
        systemInput: systemInput,
        handleInput: handleInput
    }



}());

var events = (function(){
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

    return {
        nameResult: nameResult
    }
}())

var socket = io.connect();
$(document).ready(function() {
    var chat = new Chat(socket);

    //socket.emit('disconnect');

    //var game = document.location.hash.replace('#', '');
    //chat.handleAction({ action: 'join', game: game });

    //Name Validation
    socket.on('nameResult', events.nameResult);
    
    socket.on('joinResult', function(result) {
        var game = result.game;
        $('#roomName').text(game);

        //$('#games').append(mathui.userInput(game));
        //if(game !== 'Lobby'){
        //$('#chat').append(mathui.systemInput('Room changed.'));
        //}
    });
    
    socket.on('message', function (message) {
        $('#chat').append(mathui.systemInput(message.text));
    });

    socket.on('listGamesResult', function(games) {
        $('#games').empty();

        for(var i = 0, len = games.length; i < len; i++){
            $('#games').append(mathui.userInput(games[i]));
        }
    
        $('#games div').click(function() {
            chat.handleAction({ action: 'join', game: $(this).text() });
            $('#send-message').focus();
        });

    });

    socket.on('listNamesResult', function(names) {
        $('#guests').empty();
        for(var i = 0, len = names.length; i < len; i++){
            $('#guests').append(mathui.userInput(names[i]));
        }

    });

    socket.on('listStats', function(stats){
        console.log(stats)
    })

    setInterval(function() {
        socket.emit('listGames');
    }, 1000);






    $('#send-message').focus();
    
    $('#game-controls').submit(function(e) {
        mathui.handleInput(chat, socket);
        e.preventDefault();
    });

    var validName;
    var i = 0;

    //Name
    $('#name').keyup(function(e){
        clearTimeout(validName);
        //TO DO - Validate Name (no Swears)
        var name = $.trim(this.value);
        validName = setTimeout(function(){
            chat.handleAction({ action: 'name', name: name });
        }, 1000);
    });

    //Game Selection
    $('.games a').click(function(e){
        var t = e.currentTarget;
        var game = t.hash.replace('#', '');
        e.preventDefault();
        $(game).addClass('active');

        room = game;
        chat.handleAction({ action: 'join', game: game });

        $('#step1').hide();
        $('#step2').show();
        
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

});