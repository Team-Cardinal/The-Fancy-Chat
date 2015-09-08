using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using FancyChat.Data;
using FancyChat.Models;
using FancyChat.Services.Models;
using Microsoft.AspNet.SignalR;

namespace FancyChat.Services.Hubs
{
    public class ChatHub : Hub
    {
        private FancyChatContext db = FancyChatContext.Create();

       
        
        public void Connect(string userName)
        {
            var onlineUsers = db.OnlineUsers;
            var id = Context.ConnectionId;
            var user = db.Users.FirstOrDefault(u => u.UserName == userName);



            if (onlineUsers.Count(x => x.ConnectionId == id) == 0)
            {
                onlineUsers.Add(new OnlineUser()
                {
                    ConnectionId = id,
                    User = user

                });
                db.SaveChanges();

                var onlineUsersList = db.OnlineUsers.Select(u => new UserModel()
                {
                    ConnectionId = u.ConnectionId,
                    UserName = u.User.UserName
                });

                // send to caller
                Clients.Caller.onConnected(id, userName, onlineUsersList);
               
               

                // send to all except caller client
                Clients.Others.onNewUserConnected(id, userName);

            }
        }

        public void SendMessageToAll(string userName, string message)
        {
            

            // Broad cast message
            Clients.All.messageReceived(userName, message);
        }

        public void SendPrivateMessage(int chatId, string message)
        {
            var onlineUsers = db.OnlineUsers;
            string fromUserId = Context.ConnectionId;
            var chat = db.Chats.Find(chatId);

            // TODO..
            if (chat == null)
            {
                return;
            }

            //var toUser = onlineUsers.FirstOrDefault(x => x.ConnectionId == toUserId);
            var fromUser = onlineUsers.FirstOrDefault(x => x.ConnectionId == fromUserId);
            var toUser = chat.Users.FirstOrDefault(u => u.Id != fromUser.UserId);

            var toUserConnection = onlineUsers.OrderByDescending(u => u.Id).FirstOrDefault(u => u.UserId == toUser.Id);

            if (toUserConnection != null && fromUser != null)
            {
                // send to 
                //Clients.Client(toUserConnectionId.ConnectionId).sendPrivateMessage(fromUserId, fromUser.User.UserName, message);
                Clients.Client(toUserConnection.ConnectionId).sendPrivateMessage(chatId, fromUser.User.UserName, message);

                // send to caller user
                //Clients.Caller.sendPrivateMessage(toUserConnectionId.ConnectionId, fromUser.User.UserName, message);
                Clients.Caller.sendPrivateMessage(chatId, fromUser.User.UserName, message);
            }
            else
            {
                Clients.Caller.sendPrivateMessage(chatId, fromUser.User.UserName, message);
            }
        }

        public void DisconnectUser(bool isDisconnected)
        {
            this.OnDisconnected(isDisconnected);
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            var onlineUsers = db.OnlineUsers;

            if (stopCalled)
            {
                var item = onlineUsers.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);
                var newUserModel = new UserModel()
                {
                    ConnectionId = item.ConnectionId,
                    UserName = item.User.UserName
                };
                
               
                if (newUserModel != null)
                {
                   

                    onlineUsers.Remove(item);

                    var id = Context.ConnectionId;
                    Clients.Caller.onCurrentUserDisconnected();
                    Clients.All.onUserDisconnected(id, newUserModel.UserName);
                    
                }
            }
            else
            {
                var item = onlineUsers.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);
                var newUserModel = new UserModel()
                {
                    ConnectionId = item.ConnectionId,
                    UserName = item.User.UserName
                };


                if (newUserModel != null)
                {
                    onlineUsers.Remove(item);

                    var id = Context.ConnectionId;
                    Clients.Caller.onCurrentUserDisconnected();
                    Clients.All.onUserDisconnected(id, newUserModel.UserName);
                }
            }

            db.SaveChanges();

            return base.OnDisconnected(stopCalled);
        }
    }
}