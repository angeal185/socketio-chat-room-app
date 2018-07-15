const socket = io.connect();
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

var divTpl = _.template('<div id="{{id}}"></div>'),
inputTpl = _.template('<input type="{{type}}" id="{{id}}" placeholder="{{placeholder}}">'),
btnTpl = _.template('<button type="button" id="{{id}}" class="btn {{clas}}">{{title}}</button>'),
labelTpl = _.template('<label id="{{id}}" class="{{clas}}">{{title}}</label>');
var user;


function display(i,e){
  $(i).css('display', e);
}

function disable(i){
  $(i).attr('disabled', 'true');
}

function enable(i){
  $(i).removeAttr('disabled');
}

function init(){
  $('#name').keypress(function(e) {
    if(e.which == 10 || e.which == 13) {
      setUsername()
    }
  });
  $('#setUser').click(function(event) {
    setUsername()
  });
}

function sendMessage() {
   var msg = $('#message');
   if(msg.val()) {
      socket.emit('msg', {message: msg.val(), user: user});
      msg.val('')
   }
}

function setUsername() {
  var un = $('#name').val();
  if ((un.length < 17) && (un.length > 3)){
    socket.emit('setUsername', un);
  } else {
    $('#infoLabel').css('color', 'red').html('username must be between 4-16 characters');
  }
 };

 socket.on('userExists', function(data) {
    $('#infoLabel').css('color', 'red').html(data);
 });

 socket.on('userSet', function(data) {
    user = data.username;
    $('#details').val('{"id":"'+data.id+'","user":"'+user+'"}')
    var chatLabel = [{
      'id':'user',
      'class':'',
      'title':'User: '+user
    },{
      'id':'total',
      'class':'right',
      'title':''
    }];
    var chatBtns  = [{
      'id':'sendMsgBtn',
      'class':'mr10',
      'title':'send'
    },{
      'id':'imgBtn',
      'class':'mr10',
      'title':'img'
    },{
      'id':'linkBtn',
      'class':'mr10',
      'title':'link'
    },{
      'id':'pmOpenBtn',
      'class':'mr10 modal-trigger',
      'title':'private'
    },{
      'id':'clearBtn',
      'class':'right',
      'title':'clear'
    }]


    $('#chat').empty().removeClass('s6 push-s3').addClass('s9').append(
      '<h3>Chat</h3>'
    );

    _.forEach(["labelBox","msgBox","inputBox","imgDiv","linkDiv"],function(i){
      $('#chat').append(divTpl({
        'id':i
      })
    )});

    _.forEach(chatLabel,function(i){
      $('#labelBox').append(labelTpl({
        'id':i.id,
        'clas':i.class,
        'title':_.capitalize(i.title)
      }))
    });

    _.forEach(chatBtns,function(i){
      $('#inputBox').append(btnTpl({
        'id':i.id,
        'clas':i.class,
        'title':_.capitalize(i.title)
      }))
    });
    $('#inputBox').prepend(
      inputTpl({
        'type':'text',
        'id':'message',
        'placeholder':'type msg...'
      })
    );

    _.forEach(["img","link"],function(i){
      $('#'+i+'Div').append(
        labelTpl({
          'id':'',
          'clas':'',
          'title': i+' url'
        }),
        inputTpl({
          'type':'url',
          'id': i+'Url',
          'placeholder':'type '+i+' url...'
        }),
        btnTpl({
          'id':'send'+_.capitalize(i)+'Btn',
          'clas':'mr10',
          'title':'send'
        }),
        btnTpl({
          'id':'close' + _.capitalize(i) + 'Btn',
          'clas':'right',
          'title':'cancel'
        })
      );
    });


    display('#users','inline-block')

    $('#sendMsgBtn').click(function() {
      sendMessage();
    });




    _.forEach(["img","link"],function(i){

      $('#'+i+'Btn').click(function() {
        display('#inputBox','none')
        display('#'+i+'Div','inline-block')
        disable(this)
      });

      $('#send' + _.capitalize(i) + 'Btn').click(function() {
        socket.emit('post' + _.capitalize(i),{
          user: data.username,
          i: $('#'+i+'Url').val()
        })
        display('#'+i+'Div','none')
        display('#inputBox','inline-block')
        enable('#'+i+'Btn')
        $('#'+i+'Url').val('')
      });
      $('#close' + _.capitalize(i) + 'Btn').click(function() {
        display('#'+i+'Div','none')
        display('#inputBox','inline-block')
        enable('#'+i+'Btn')
      });
    });



    $('#clearBtn').click(function() {
      $('#msgBox').empty();
    });
    $('#pmOpenBtn').attr('data-target', 'pmModal').click(function(event) {
      $('#pmOpenBtn').removeClass('haveMsg');
    });
    $('#pmcloseBtn').click(function(event) {
      $('#pmOpenBtn').removeClass('haveMsg');
    });

    $('#message').keypress(function(e) {
      if(e.which == 10 || e.which == 13) {
        sendMessage();
      }
    });
    $('#pmModal').modal();

 });

 socket.on('listUsers', function(data) {
   $('#userList').empty();

    _.forEach(data,function(i){
      $('#userList').append('<p class="userLink modal-trigger truncate user'+i+'" data-target="pmModal">'+i+'</p>');
    })

    if ($('#details').val() != ''){
      socket.emit('userDetails',JSON.parse($('#details').val()))
    }
    $('.userLink').off().click(function(event) {
      var usrId = $(this).attr('user-id'),
      usrName  = this.innerHTML,
      details = JSON.parse($('#details').val());
      display('#pmInput','inline-block')
      display('#pmBtn','inline-block')
      //console.log(usrName)
      $('#pmModalTitle').html('Send message to '+usrName)
      $('#pmDetails').val(JSON.stringify({
        user: details.user,
        id: details.id,
        pmUser: usrName,
        pmId: usrId
      }))
      $('#pmBtn').off().click(function(event) {
        socket.emit('sendPrivate',{
          user: details.user,
          id: details.id,
          pmUser: usrName,
          pmId: usrId,
          message: $('#pmInput').val()
        })
        sendPrivateMsg(details.id,details.user,'Sent message to ',$('#pmInput').val())
      });
    });
 });

function sendPrivateMsg(id,user,to,message){
  $('#pmBox').append('<p class="red userReply" data-id="'+id+'" data-user="'+user+'">'+ to + user + ': <span class="teal">' + message +'</span> <small class="grey">'+ new Date().toLocaleTimeString().slice(0,-2) +'</small></p>');
}

 socket.on('getPrivate', function(data) {
   sendPrivateMsg(data.id,data.user,'Recieved message from ',data.message)
   $('#pmOpenBtn').addClass('haveMsg');
 });

function addMsg(i,e){
  $(i).append('<p class="red">' + e.user + ': <span class="teal">' +e.message +'</span> <small class="grey">'+ new Date().toLocaleTimeString().slice(0,-2) +'</small></p>');
}

 socket.on('newmsg', function(data) {
    if(user) {
       addMsg('#msgBox',data)
    }
 });

 socket.on('private', function(data) {
      addMsg('#msgBox',data)
 });

 socket.on('newimg', function(data) {
   function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
  var imgNo = getRandomInt(9999999)
    if(user) {
       $('#msgBox').append('<p class="red">' + data.user + ': <br><img class="materialboxed id'+imgNo+'" width="150" src="' + data.i +'"><br><small class="grey">'+ new Date().toLocaleTimeString().slice(0,-2) +'</small></p>');
    }
    $('.id'+imgNo).materialbox();
 });

 socket.on('newlink', function(data) {
   console.log(data)
    if(user) {
       $('#msgBox').append('<p class="red">' + data.user + ': <a class="teal underline" href="' + data.i + '" target="_blank">' + data.i + '</a> <small class="grey">'+ new Date().toLocaleTimeString().slice(0,-2) +'</small></p>');
    }
 });

socket.on('newclientconnect',function(data) {
     $('#msgBox').append(data.description);
});

socket.on('message', function(data){
  $('#msgBox').append(data)
  console.log(data)
});

socket.on('broadcast',function(data) {
  $('#total').html($('.userLink').length + ' users connected!');
});

socket.on('usersDetails',function(data) {
     $('.user'+data.user).attr('user-id',data.id)
});

init()
