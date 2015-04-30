var Chat = (function(socket) {
    //this.socket = socket;
    var shown = 1;
    var answered = 0;
    var answers = [];

    function changeGame (game) {
        socket.emit('join', {
            game: game
        });
    }
    function changeName (name) {
        socket.emit('changeName', name);
    }
    function computeStats(obj){
        var m = {}
        var answered = obj.answered? answered+1 : answered; 
        
        answers.push({
            question: obj.question, 
            answer: obj.answer, 
            time: obj.time
        });

        m = {
            questions: {
                shown: shown++,
                answered: answered,
                answers: answers
            }
        }
        socket.emit('stats', {
            stats: m
        });
    }
    function disconnect(){
        socket.emit('disconnect');
    }
    function handleAction(obj){
        var action = obj.action;
        delete obj.action;
        switch (action) {
            case 'disconnect':
                //console.log('aaaaa');
                disconnect();
            break;
            case 'join' :
                changeGame(obj.game);
            break;
            case 'name' :
                changeName(obj.name);
            break;
            case 'profile' :
                console.log('updating profile...')
                updateProfile(obj);
            break;
            default:
                break;
        }
    }
    function sendMessage(obj) {
        var message = {
            game: obj.game,
            text: obj.message
        }
        socket.emit('message', message);
    }
    function updateProfile(obj){
        socket.emit('updateProfile', obj);
    }
    return {
        //changeGame: changeGame,
        //computeStats: computeStats,
        handleAction: handleAction,
        sendMessage: sendMessage
        
    }
    
});