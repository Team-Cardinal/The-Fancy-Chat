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

    return String(string).replace(/([&<>"'\/])(?!img)(?!S)(?!Emo)(?! )(?!>)/g, function (s) {

        return entityMap[s];
    });
}

function registerEvents(chatHub) {

    function registerRequest(email, name, password, confirmPassword) {
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
            loginRequest(name, password);

        }).fail(function (data) {

            var responsetext = JSON.parse(data.responseText);

            noty({
                text: responsetext.ModelState["model.UserName"][0],
                layout: 'center',
                type: 'error',
                timeout: 750
            });
            //console.log("Username or email already taken.");

        });
    }
    //click on login button
    function loginRequest(name, password) {
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
            //$.noty.defaults.killer = true;

            noty({
                text: 'Invalid username or password!',
                layout: 'center',
                type: 'error',
                timeout: 750
            });
        });
    }
    function sendMessageRequest(msg) {
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
            noty({
                text:'Cannot send message.',
                layout: 'center',
                type: 'error',
                timeout: 750
            });
            console.log("Cannot send message.");
        });
    }

    $("#btnRegister").click(function () {

        var email = $("#registerEmail").val();
        var name = $("#registerUsername").val();
        var password = $("#registerPassword").val();
        var confirmPassword = $("#confirmRegisterPassword").val();
        if (password != confirmPassword) {
            noty({
                text: 'Passwords do not match.',
                layout: 'center',
                type: 'error',
                timeout: 750
            });
            //console.log("Passwords do not match.");
        } else {
            if (name.length >= 5  && password.length > 0 && name.length <=10) {
                registerRequest(email, name, password, confirmPassword);
            }
            else {

                if (name.length < 1) {
                    noty({
                        text: 'Please enter name!',
                        layout: 'center',
                        type: 'error',
                        timeout: 750
                    });

                    //alert("Please enter name!");
                }
                else if (password.length < 1) {
                    //alert("Please enter password!");
                    noty({
                        text: 'Please enter password!',
                        layout: 'center',
                        type: 'error',
                        timeout: 750
                    });
                }
                else if (name.length > 10 || name.length < 5) {
                    alert("Username should be between 5 and 10 characters long.");
                }
            }
        }

    });



    $("#btnLogin").click(function () {

        var name = $("#txtUserName").val();
        var password = $("#txtPassword").val();
        if (name.length > 0 && password.length > 0) {
            loginRequest(name, password);
        }
        else {

            if (name.length < 1) {
                noty({
                    text: 'Please enter name!',
                    layout: 'center',
                    type: 'error',
                    timeout: 750
                });
                //alert("Please enter name!");
            }
            else if (password.length < 1) {
                noty({
                    text: 'Please enter password!',
                    layout: 'center',
                    type: 'error',
                    timeout: 750
                });
                //alert("Please enter password!");
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
        var token = sessionStorage.getItem("authorizationToken");

        //console.log(chatPartner);
        if (chatPartner) {

            var currentUser = sessionStorage.getItem("username");
            console.log(currentUser);

            $.ajax({
                url: "http://localhost:24252/api/chats",
                method: "POST",
                headers: {
                    "Authorization": "bearer " + token
                },
                data: {                    
                    "CurrentUser": currentUser,
                    "ChatPartner": chatPartner
                }
            }).done(function (data) {
                //alert("Chat has been successfully created.");
                noty({
                    text: 'Chat has been successfully created.',
                    layout: 'center',
                    type: 'success',
                    timeout: 750
                });
                AppendNewActiveChat(data, chatHub);

            }).fail(function (data) {
                console.log((data));
                if (data.status == 404) {
                    noty({
                        text:'This user does not exist',
                        layout: 'center',
                        type: 'error',
                        timeout: 750
                    });
                } else {
                    noty({
                        text:JSON.parse(data.responseText).Message,
                        layout: 'center',
                        type: 'error',
                        timeout: 750
                    });
                }
                
            });
        }
    });




    $('#btnSendMsg').click(function () {

        var msg = $("#txtMessage").val();

        if (msg.length > 0) {
            sendMessageRequest(msg);

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
    function getMessagesRequest() {
        var token = sessionStorage.getItem("authorizationToken");
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
            noty({
                text: 'Could not load messages!',
                layout: 'center',
                type: 'error',
                timeout: 750
            });
            //console.log("Could not load messages");
        });
    }

    chatHub.client.onConnected = function (id, userName, allUsers) {


        setScreen(true);

        $('#hdId').val(id);
        $('#hdUserName').val(userName);
        $('#spanUser').html(escapeHtml(userName));

        // Add All Users
        for (i = 0; i < allUsers.length; i++) {

            AddUser(chatHub, allUsers[i].ConnectionId, allUsers[i].UserName);
        }

        // Add Existing Messages
        getMessagesRequest();
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


        var disc = $('<div class="disconnect">"' + escapeHtml(userName) + '" logged off.</div>');

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
            GetPrivateChat(sessionStorage.getItem("username"), windowId);
        }
        else {
            $('#' + ctrId).find('#divMessage').append('<div class="privateMessage"><span class="userName">' + fromUserName + '</span>: ' + escapeHtml(message) + '</div>');
        }

        // set scrollbar
        var height = $('#' + ctrId).find("#divMessage")[0].scrollHeight;
        $('#' + ctrId).find("#divMessage").scrollTop(height);

    }

}

function AddUser(chatHub, id, name) {

    var userId = $('#hdId').val();

    var html = "";

    if (userId == id) {

        html = $('<div class="currentUser">' + escapeHtml(name) + "</div>");

    }
    else {

        html = $('<div id="' + id + '" class="user" >' + escapeHtml(name) + '</div>');
    }

    $("#divusers").append(html);

}

function AddMessage(userName, message) {

    message = CheckForSmiley(message);

    if (userName == sessionStorage.getItem("username")) {

        $('#divChatWindow').append('<div class="message"><span class="currentUserName">' + escapeHtml(userName) + '</span>: ' + escapeHtml(message) + '</div>');
    } else {
        $('#divChatWindow').append('<div class="message"><span class="userName">' + escapeHtml(userName) + '</span>: ' + escapeHtml(message) + '</div>');

    }
    var height = $('#divChatWindow')[0].scrollHeight;
    $('#divChatWindow').scrollTop(height);
}


function OpenPrivateChatWindow(chatHub, id, userName) {

    var ctrId = 'private_' + id;
    var chatId = id;

    if ($('#' + ctrId).length > 0) return;

    createPrivateChatWindow(chatHub, id, ctrId, userName, chatId);

}

function createPrivateChatWindow(chatHub, userId, ctrId, userName) {
    var chatId = userId;
    var div = '<div id="' + ctrId + '" class="ui-widget-content draggable" rel="0">' +  
               '<div class="header">' +
                  '<div  style="float:right;" class="chatPartnerName">' +
                      '<img id="imgDelete"  style="cursor:pointer;" src="/Images/delete.png"/ height="18" width="18>' +
                   '</div>' +
                   '<span class="selText" rel="0">' + escapeHtml(userName) + '</span>' +                  
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
            $('#divHome').find('#divActiveChats').append('<div id="' + result[i].Id + '"><span class="activeChat">' + escapeHtml(result[i].ChatPartner) + '</span></div>');
        }
        $('.activeChat').click(function () {
            var id = $(this).parent().attr('id');
            if ($('#' + "private_" + id).length == 0) {
                ShowActiveChat(id, chatHub);
            }
        });
        console.log(result);
    });
}

function AppendNewActiveChat(data, chatHub) {
    $('#divHome').find('#divActiveChats').append('<div id="' + data.Id + '"><span class="activeChat">' + data.ChatPartner + '</span></div>');
    $('.activeChat').click(function () {
        var id = $(this).parent().attr('id');
        if ($('#' + "private_" + id).length == 0) {
            ShowActiveChat(id, chatHub);
        }
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
        method: "GET"
    }).done(function (result) {
        for (var i = 0; i < result.length; i++) {
            $('div #private_' + id).find('#divMessage').append('<div class="privateMessage"><span class="userName">' + result[i].Name + ':' + escapeHtml(result[i].MessageContent) + '</span></div>');
        }
        var height = $('#' + "private_" + id).find("#divMessage")[0].scrollHeight;
        $('#' + "private_" + id).find("#divMessage").scrollTop(height);
    });
}


function SendChatMessage(username, message, chatId, chatHub) {
    var token = sessionStorage.getItem("authorizationToken");
    $.ajax({
        url: "http://localhost:24252/api/chats/" + username + "/" + chatId,
        headers: {
            "Authorization": "bearer " + token
        },
        method: "POST",
        data: {
            "ChatId": chatId,
            "Content": message,
            "Sender": username,
        }
    }).done(function (data) {
        chatHub.server.sendPrivateMessage(chatId, message);
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