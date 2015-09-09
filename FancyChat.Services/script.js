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

        $("#divChat").show();
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

    function RegisterRequest(email, name, password, confirmPassword) {
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
            console.log(data);
            LoginRequest(name, password);

        }).fail(function (data) {
            console.log("Username or email already taken.");
        });
    }
    //click on login button
    function LoginRequest(name, password) {
        $.ajax({
            url: "http://localhost:24252/api/Account/Login",
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
            GetActiveChats(name, chatHub);
            console.log(data);


        }).fail(function (data) {
            console.log("Invalid username or password");
        });
    }

    $("#btnRegister").click(function () {

        var email = $("#registerEmail").val();
        var name = $("#registerUsername").val();
        var password = $("#registerPassword").val();
        var confirmPassword = $("#confirmRegisterPassword").val();
        if (password != confirmPassword) {
            console.log("Passwords do not match.");
        } else {
            if (name.length > 0 && password.length > 0) {
                RegisterRequest(email, name, password, confirmPassword);
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



    $("#btnLogin").click(function () {

        var name = $("#txtUserName").val();
        var password = $("#txtPassword").val();
        if (name.length > 0 && password.length > 0) {
            LoginRequest(name, password);
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
        setScreen(false);
        console.log("Logout button clicked.");
    });

    //click on Start New Chat button
    $("#btnCreateChat").click(function () {

        var chatPartner = $("#chatPartner").val();
        //console.log(chatPartner);
        if (chatPartner) {

            var currentUser = sessionStorage.getItem("username");
            console.log(currentUser);

            $.ajax({
                url: "http://localhost:24252/api/chats",
                method: "POST",
                data: {
                    //"Name": currentUser + " " + chatPartner,
                    "CurrentUser": currentUser,
                    "ChatPartner": chatPartner
                }
            }).done(function (data) {
                alert("Chat has been successfully created.");
                AppendNewActiveChat(data, chatHub);

            }).fail(function (data) {
                console.log(data.responseText);
            });
        }
    });


    $('#btnSendMsg').click(function () {

        var msg = $("#txtMessage").val();

        if (msg.length > 0) {

            var userName = sessionStorage.getItem("username");
            var token = sessionStorage.getItem("authorizationToken");
            $.ajax({
                url: "http://localhost:24252/api/messages",
                method: "POST",
                headers: {
                    "Authorization": "bearer " + token
                },
                data: {
                    "Message": msg,
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

        var token = sessionStorage.getItem("authorizationToken");

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
            headers: {
                "Authorization": "bearer " + token
            }

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

    chatHub.client.onCurrentUserDisconnected = function () {
        sessionStorage.clear();
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

    chatHub.client.messageReceived = function (userName, message) {

        AddMessage(userName, message);
    }


    chatHub.client.sendPrivateMessage = function (windowId, fromUserName, message) {

        var ctrId = 'private_' + windowId;

        message = CheckForSmiley(message);

        if ($('#' + ctrId).length == 0) {

            createPrivateChatWindow(chatHub, windowId, ctrId, fromUserName);

        }

        $('#' + ctrId).find('#divMessage').append('<div class="message"><span class="userName">' + fromUserName + '</span>: ' + escapeHtml(message) + '</div>');

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

    $('#divChatWindow').append('<div class="message"><span class="userName">' + userName + '</span>: ' + escapeHtml(message) + '</div>');

    var height = $('#divChatWindow')[0].scrollHeight;
    $('#divChatWindow').scrollTop(height);
}


function OpenPrivateChatWindow(chatHub, id, userName) {

    var ctrId = 'private_' + id;
    var chatId = id;

    if ($('#' + ctrId).length > 0) return;

    createPrivateChatWindow(chatHub, id, ctrId, userName, chatId);

}

function createPrivateChatWindow(chatHub, userId, ctrId, userName, chatId) {
    //function createPrivateChatWindow(chatHub, data) {

    var div = '<div id="' + ctrId + '" class="ui-widget-content draggable" rel="0">' +
    //var div = '<div id="' + data.Id + '" class="ui-widget-content draggable" rel="0">' +
               '<div class="header">' +
                  '<div  style="float:right;">' +
                      '<img id="imgDelete"  style="cursor:pointer;" src="/Images/delete.png"/>' +
                   '</div>' +

                   '<span class="selText" rel="0">' + userName + '</span>' +
                   //'<span class="selText" rel="0">' + data.ChatPartner + '</span>' +
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
            SendChatMessage(sessionStorage.getItem("username"), msg, chatId, chatHub);
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
function GetActiveChats(username, chatHub) {
    var token = sessionStorage.getItem("authorizationToken");
    $.ajax({
        url: "http://localhost:24252/api/chats/" + username,
        metod: "GET",
        headers: {
            "Authorization": "bearer " + token
        }
    }).done(function (result) {
        for (var i = 0; i < result.length; i++) {
            //$('#divHome').find('#divActiveChats').append('<div id="' + result[i].Id + '"><span class="activeChat" onclick="GetPrivateChat(' + result[i].Id + ',' + sessionStorage.getItem("username") + ')">' + result[i].ChatPartner + '</span></div>');
            $('#divHome').find('#divActiveChats').append('<div id="' + result[i].Id + '"><span class="activeChat">' + result[i].ChatPartner + '</span></div>');
        }
        $('.activeChat').click(function () {
            var id = $(this).parent().attr('id');
            ShowActiveChat(id, chatHub);
        });
        console.log(result);
    });
}

function AppendNewActiveChat(data, chatHub) {
    //$('#divHome').find('#divActiveChats').append('<div id="' + data.Id + '"><span class="activeChat" onclick="GetPrivateChat(' + data.Id + ',' + sessionStorage.getItem("username") + ')">' + data.ChatPartner + '</span></div>');
    $('#divHome').find('#divActiveChats').append('<div id="' + data.Id + '"><span class="activeChat" onclick="ShowActiveChat(' + data.Id + ')">' + data.ChatPartner + '</span></div>');
    $('.activeChat').click(function () {
        var id = $(this).parent().attr('id');
        ShowActiveChat(id, chatHub);
    });
}


function ShowActiveChat(id, chatHub) {
    var name = $("#" + id).text();
    OpenPrivateChatWindow(chatHub, id, name);
    GetPrivateChat(name, id);
}


function GetPrivateChat(username, id) {
    var token = sessionStorage.getItem("authorizationToken");
    $.ajax({
        url: "http://localhost:24252/api/chats/" + username + "/" + id,
        headers: {
            "Authorization": "bearer " + token
        },
        method: "GET",
    }).done(function (result) {
        for (var i = 0; i < result.length; i++) {
            $('div #private_' + id).find('#divMessage').append('<div><span>' + result[i].Name + ':' + escapeHtml(result[i].MessageContent) + '</span></div>');
        }
    });
}


function SendChatMessage(username, message, id, chatHub) {
    var token = sessionStorage.getItem("authorizationToken");
    $.ajax({
        url: "http://localhost:24252/api/chats/" + username + "/" + id,
        headers: {
            "Authorization": "bearer " + token
        },
        method: "POST",
        data: {
            "ChatId": id,
            "Content": message,
            "Sender": username,
        }
    }).done(function (data) {
        console.log("Private message sent.");
        console.log(data);
    });
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