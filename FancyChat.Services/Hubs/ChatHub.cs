﻿using System;
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
                Clients.Caller.onConnected(id, userName, onlineUsersList); //todo: this method isnt called
               
               

                // send to all except caller client
                Clients.Others.onNewUserConnected(id, userName);

            }
        }

        public void SendMessageToAll(string userName, string message)
        {
            

            // Broad cast message
            Clients.All.messageReceived(userName, message);
        }

        public void SendPrivateMessage(string toUserId, string message)
        {
            var onlineUsers = db.OnlineUsers;
            string fromUserId = Context.ConnectionId;

            var toUser = onlineUsers.FirstOrDefault(x => x.ConnectionId == toUserId);
            var fromUser = onlineUsers.FirstOrDefault(x => x.ConnectionId == fromUserId);

            if (toUser != null && fromUser != null)
            {
                // send to 
                Clients.Client(toUserId).sendPrivateMessage(fromUserId, fromUser.User.UserName, message);

                // send to caller user
                Clients.Caller.sendPrivateMessage(toUserId, fromUser.User.UserName, message);
            }
            db.SaveChanges();

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
                    Clients.All.messageReceived(newUserModel.UserName, "has left the chat.");

                    onlineUsers.Remove(item);

                    var id = Context.ConnectionId;
                    Clients.All.onUserDisconnected(id, newUserModel.UserName);
                }
            }
            else
            {
                var item = onlineUsers.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);
                if (item != null)
                {
                    onlineUsers.Remove(item);

                    var id = Context.ConnectionId;
                    Clients.All.onUserDisconnected(id, item.User.UserName);
                }
            }

            db.SaveChanges();

           
            

            return base.OnDisconnected(true);
        }

        
    }
}