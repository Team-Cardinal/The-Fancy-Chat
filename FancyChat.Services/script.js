$(function () {
    var isLogged = false;

    //azure: http://fancychat.cloudapp.net
    //localhost http://localhost:24252

    setScreen(isLogged);

    // Declare a proxy to reference the hub. 
    var chatHub = $.connection.chatHub;




    registerClientMethods(chatHub);

    // Start Hub
    $.connection.hub.start().done(function () {

        registerEvents(chatHub);

    });

});

function setScreen(isLogged) {

    if (!isLogged) {

        $("#divChat").hide();
        $("#divLogin").show();
        $("#divRegister").show();
        $("#divHome").hide();
    }
    else {

        //$("#divChat").show();
        $("#divLogin").hide();
        $("#divRegister").hide();
        $("#divHome").show();
    }

}
var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};

function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
    });
}

function registerEvents(chatHub) {

    $("#btnRegister").click(function () {

        var email = $("#registerEmail").val();
        var name = $("#registerUsername").val();
        var password = $("#registerPassword").val();
        var confirmPassword = $("#confirmRegisterPassword").val();
        if (password != confirmPassword) {
            console.log("Passwords do not match.");
        } else {
            if (name.length > 0 && password.length > 0) {
                $.ajax({
                    url: "http://localhost:24252/api/account/register",
                    method: "POST",
                    data: {
                        "email": email,
                        "userName": name,
                        "password": password,
                        "confirmPassword": confirmPassword
                    }
                }).done(function (data) {
                    sessionStorage.setItem("username", name);
                    sessionStorage.setItem("authorizationToken", data.access_token);
                    console.log(data);
                    chatHub.server.connect(name);

                }).fail(function (data) {
                    console.log("Invalid username or password");
                });
            }
            else {

                if (name.length < 1) {
                    alert("Please enter name!");
                }
                else if (password.length < 1) {
                    alert("Please enter password!");
                }
            }
        }

    });

    //click on login button
    $("#btnLogin").click(function () {

        var name = $("#txtUserName").val();
        var password = $("#txtPassword").val();
        if (name.length > 0 && password.length > 0) {
            $.ajax({
                url: "http://localhost:24252/token",
                method: "POST",              
                data: ({
                    "userName": name,
                    "password": password,
                    "grant_type": "password"
                })
                
            }).done(function (data) {
                sessionStorage.setItem("username", name);
                sessionStorage.setItem("authorizationToken", data.access_token);
                chatHub.server.connect(name);
                GetActiveChats(name);
                console.log(data);

            }).fail(function (data) {
                console.log("Invalid username or password");
            });
        }
        else {

            if (name.length < 1) {
                alert("Please enter name!");
            }
            else if (password.length < 1) {
                alert("Please enter password!");
            }
        }
    });

    $("#btnLogout").click(function () {
        chatHub.server.disconnectUser(true);
    });

    //click on Start New Chat button
    $("#btnCreateChat").click(function () {

        var chatPartner = $("#chatPartner").val();
        console.log(chatPartner);
        if (chatPartner) {

            var currentUser = sessionStorage.getItem("username");
            console.log(currentUser);

            $.ajax({
                url: "http://localhost:24252/api/chats",
                method: "POST",
                data: {
                    "Name": currentUser + " " + chatPartner,
                    "CurrentUser": currentUser,
                    "ChatPartner": chatPartner
                }
            }).done(function (data) {
                alert("Chat has been successfully created.");
                GetActiveChats(currentUser);

            }).fail(function (data) {
                console.log("Some error message.")
            });
        }
    });


    $('#btnSendMsg').click(function () {

        var msg = $("#txtMessage").val();

        if (msg.length > 0) {

            var userName = sessionStorage.getItem("username");
            $.ajax({
                url: "http://localhost:24252/api/messages",
                method: "POST",
                data: {
                    "Message": escapeHtml(msg),
                    "SenderUserName": userName,
                    "DateSent": new Date().toLocaleString()
                }
            }).done(function (data) {
                chatHub.server.sendMessageToAll(userName, msg);
                $("#txtMessage").val('');
                console.log(data);

            }).fail(function (data) {
                console.log("Cannot send message.");
            });

        }
    });


    $("#txtNickName").keypress(function (e) {
        if (e.which == 13) {
            $("#btnStartChat").click();
        }
    });

    $("#txtMessage").keypress(function (e) {
        if (e.which == 13) {
            $('#btnSendMsg').click();
        }
    });


}

function registerClientMethods(chatHub) {


    // Calls when user successfully logged in
    chatHub.client.onConnected = function (id, userName, allUsers) {

        var currentUser = sessionStorage.getItem("userName");
        setScreen(true);

        $('#hdId').val(id);
        $('#hdUserName').val(userName);
        $('#spanUser').html(userName);

        // Add All Users
        for (i = 0; i < allUsers.length; i++) {

            AddUser(chatHub, allUsers[i].ConnectionId, allUsers[i].UserName);
        }

        // Add Existing Messages
        $.ajax({
            url: "http://localhost:24252/api/messages",
            method: "GET",

        }).done(function (data) {
            console.log(data);
            for (i = 0; i < data.length; i++) {

                AddMessage(data[i].SenderUserName, data[i].Message);
            }

        }).fail(function (data) {
            console.log("Could not load messages");
        });


    }

    // On New User Connected
    chatHub.client.onNewUserConnected = function (id, name) {

        AddUser(chatHub, id, name);
    }


    // On User Disconnected
    chatHub.client.onUserDisconnected = function (id, userName) {

        $('#' + id).remove();

        var ctrId = 'private_' + id;
        $('#' + ctrId).remove();


        var disc = $('<div class="disconnect">"' + userName + '" logged off.</div>');

        $(disc).hide();
        $('#divusers').prepend(disc);
        $(disc).fadeIn(200).delay(2000).fadeOut(200);



    }
    chatHub.client.serverOrderedDisconnect = function () {
        $.connection.hub.stop();
    };
    chatHub.client.messageReceived = function (userName, message) {

        AddMessage(userName, message);
    }


    chatHub.client.sendPrivateMessage = function (windowId, fromUserName, message) {

        var ctrId = 'private_' + windowId;

        message = CheckForSmiley(message);

        if ($('#' + ctrId).length == 0) {

            createPrivateChatWindow(chatHub, windowId, ctrId, fromUserName);

        }

        $('#' + ctrId).find('#divMessage').append('<div class="message"><span class="userName">' + fromUserName + '</span>: ' + message + '</div>');

        // set scrollbar
        var height = $('#' + ctrId).find('#divMessage')[0].scrollHeight;
        $('#' + ctrId).find('#divMessage').scrollTop(height);

    }

}

function AddUser(chatHub, id, name) {

    var userId = $('#hdId').val();

    var html = "";

    if (userId == id) {

        html = $('<div class="currentUser">' + name + "1" + "</div>");

    }
    else {

        html = $('<a id="' + id + '" class="user" >' + name + "2" + '<a>');

        $(html).dblclick(function () {

            var id = $(this).attr('id');

            if (userId != id)
                OpenPrivateChatWindow(chatHub, id, name);

        });
    }

    $("#divusers").append(html);

}

function AddMessage(userName, message) {

    message = CheckForSmiley(message);

    $('#divChatWindow').append('<div class="message"><span class="userName">' + userName + '</span>: ' + (message) + '</div>');

    var height = $('#divChatWindow')[0].scrollHeight;
    $('#divChatWindow').scrollTop(height);
}


function OpenPrivateChatWindow(chatHub, id, userName) {

    var ctrId = 'private_' + id;

    if ($('#' + ctrId).length > 0) return;

    createPrivateChatWindow(chatHub, id, ctrId, userName);

}

function createPrivateChatWindow(chatHub, userId, ctrId, userName) {

    var div = '<div id="' + ctrId + '" class="ui-widget-content draggable" rel="0">' +
               '<div class="header">' +
                  '<div  style="float:right;">' +
                      '<img id="imgDelete"  style="cursor:pointer;" src="/Images/delete.png"/>' +
                   '</div>' +

                   '<span class="selText" rel="0">' + userName + '</span>' +
               '</div>' +
               '<div id="divMessage" class="messageArea">' +

               '</div>' +
               '<div class="buttonBar">' +
                  '<input id="txtPrivateMessage" class="msgText" type="text"   />' +
                  '<input id="btnSendMessage" class="submitButton button" type="button" value="Send"   />' +
               '</div>' +
            '</div>';

    var $div = $(div);

    // DELETE BUTTON IMAGE
    $div.find('#imgDelete').click(function () {
        $('#' + ctrId).remove();
    });

    // Send Button event
    $div.find("#btnSendMessage").click(function () {

        $textBox = $div.find("#txtPrivateMessage");
        var msg = $textBox.val();

        console.log(msg);

        if (msg.length > 0) {

            chatHub.server.sendPrivateMessage(userId, msg);
            $textBox.val('');
        }
    });

    // Text Box event
    $div.find("#txtPrivateMessage").keypress(function (e) {
        if (e.which == 13) {
            $div.find("#btnSendMessage").click();
        }
    });

    AddDivToContainer($div);

}

function AddDivToContainer($div) {
    $('#divContainer').prepend($div);

    $div.draggable({

        handle: ".header",
        stop: function () {

        }
    });
}

//show all active chats for a specific user
function GetActiveChats(username) {
    $.ajax({
        url: "http://localhost:24252/api/chats/" + username,
        metod: "GET"
    }).done(function (result) {
        for (var i = 0; i < result.length; i++) {
            $('#divHome').find('#divActiveChats').append('<div id="' + result[i].Id + '"><span class="activeChat" onclick="ShowActiveChat()">' + result[i].Name + '</span></div>');
        }
        console.log(result);
    });
}


function ShowActiveChat() {
    $("#divChat").show();
}



function CheckForSmiley(message) {

    message = message.replace(":)", "<img src=\"Smilies/EmoticonHappy.gif\" />");
    message = message.replace(":D", "<img src=\"Smilies/EmoticonBigSmile.gif\" />");
    message = message.replace(";)", "<img src=\"Smilies/EmoticonWink.gif\" />");
    message = message.replace("8D", "<img src=\"Smilies/EmoticonCool.gif\" />");
    message = message.replace(":I", "<img src=\"Smilies/EmoticonShy.gif\" />");
    message = message.replace(":P", "<img src=\"Smilies/EmoticonTongue.gif\" />");
    message = message.replace(":(", "<img src=\"Smilies/EmoticonSad.gif\" />");
    message = message.replace("X(", "<img src=\"Smilies/EmoticonAngry.gif\" />");
    message = message.replace(":'(", "<img src=\"Smilies/EmoticonCrying.gif\" />");
    message = message.replace(":O", "<img src=\"Smilies/EmoticonSurprised.gif\" />");
    message = message.replace("(rofl)", "<img src=\"Smilies/EmoticonHysterical.gif\" />");

    return message;
}