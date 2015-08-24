using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using FancyChat.Services.Models;
using Microsoft.AspNet.SignalR;

namespace FancyChat.Services.Hubs
{
    public class ChatHub : Hub
    {
        static List<UserModel> users = new List<UserModel>();
        static List<MessageModel> messages = new List<MessageModel>();
        public void Connect(string userName)
        {
            var id = Context.ConnectionId;


            if (users.Count(x => x.ConnectionId == id) == 0)
            {
                users.Add(new UserModel() { ConnectionId = id, UserName = userName });

                // send to caller
                Clients.Caller.onConnected(id, userName, users, messages);

                // send to all except caller client
                Clients.AllExcept(id).onNewUserConnected(id, userName);

            }
        }

        public void SendMessageToAll(string userName, string message)
        {
            AddMessageinCache(userName, message); //dobavi

            // Broad cast message
            Clients.All.messageReceived(userName, message);
        }

        public void SendPrivateMessage(string toUserId, string message)
        {
            string fromUserId = Context.ConnectionId;

            var toUser = users.FirstOrDefault(x => x.ConnectionId == toUserId);
            var fromUser = users.FirstOrDefault(x => x.ConnectionId == fromUserId);

            if (toUser != null && fromUser != null)
            {
                // send to 
                Clients.Client(toUserId).sendPrivateMessage(fromUserId, fromUser.UserName, message);

                // send to caller user
                Clients.Caller.sendPrivateMessage(toUserId, fromUser.UserName, message);
            }
        }

        //public override System.Threading.Tasks.Task OnDisconnected()
        //{
        //    var item = users.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);
        //    if (item != null)
        //    {
        //        users.Remove(item);

        //        var id = Context.ConnectionId;
        //        Clients.All.onUserDisconnected(id, item.UserName);

        //    }

        //    return base.OnDisconnected();
        //}

        private void AddMessageinCache(string userName, string message)
        {
            messages.Add(new MessageModel() { UserName = userName, Message = message });

            if (messages.Count > 100)
                messages.RemoveAt(0);
        }
    }
}