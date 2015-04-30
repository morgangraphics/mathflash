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
    function gamePlay(x){
        //console.log(x);
    }
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
        //console.log(message)
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
        gamePlay: gamePlay,
        joinResult: joinResult,
        listGamesResult: listGamesResult,
        listNamesResult: listNamesResult,
        nameResult: nameResult,
        messageResult: messageResult,
        profileResult: profileResult
    }
}())

function saveYourWork(){
    console.log('foo');
}

// $(window).on('beforeunload', function(){
//     saveYourWork();
//     return "You haven\'t saved your game";
// });
$(document).ready(function() {
    //DEV
    //var game = document.location.hash.replace('#', '');
    //chat.handleAction({ action: 'join', game: game });

    // ====== APP SETUP ====== //

        //SETUP SOCKET EVENT LISTENERS/EMMITERS
        socket.on('gamePlay', ioEvents.gamePlay);
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
            //countDown();
        }, 1000);

        var time = 1 * 60;
        
        // function countDown(x){
        //     if(time <= 0){
        //         $('#timer').hide();
        //         return; 
        //     }
        //     if(x){ time = time - x; }
            
        //     var min = Math.floor(time/60);
        //     var sect = time%60;
        //     var sec = ((sect <= 9)? '0'+ sect : sect);
        //     var str =  min + ':' + sec;
        //     var $t = $('#time');
        //     if(min === 2 && sect === 0){
        //         console.log('two minute warning');
        //     }else if(min === 1 && sect === 0){
        //         $t.addClass('min');
        //     }else if(min === 0 && sec === 30){
        //         $t.removeClass('min');
        //         $t.width($t.width()); // Force Reflow to reset Animation
        //         $t.addClass('sec');
        //     }else if(min === 0 && sec <= 5){
        //         beep();
        //     }
        //     $t.html(str);
        //     time = time - 1;
        // }
        
        // function beep() {
        //     var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
        //     snd.play();
        // }

        // function _timer(){
        //     var time = .1*60;
        //     var t = new Date().getTime();

        //     window[t] = setInterval(function(){
        //             if(time <= 0){
        //                 console.log('should clear interval');
        //                 clearInterval(window[t]);
        //             }
        //             var min = Math.floor(time/60);
        //             var sect = time%60;
        //             var sec = ((sect <= 9)? '0'+ sect : sect);
        //             if(min === 0 && sect === 0){
        //                 //trigger new round
        //                 console.log('new round begins')
        //             }
        //             time = time - 1;
        //             //var str =  min + ':' + sec;
                    
        //         },1000);

        //     return window[t]; 
        // };

        //console.log(_timer());



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