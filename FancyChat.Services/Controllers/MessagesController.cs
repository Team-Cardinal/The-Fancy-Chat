﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using FancyChat.Data;
using FancyChat.Models;
using FancyChat.Services.Models;

namespace FancyChat.Services.Controllers
{
    public class MessagesController : ApiController
    {
        private FancyChatContext db = FancyChatContext.Create();

        public IHttpActionResult GetMessages()
        {
            var messages = db.Messages.Select(m => new MessageModel()
            {
                SenderUserName = m.User.UserName,
                Message = m.Text,
                DateSent = m.DateTime
                
            });

            if (!ModelState.IsValid)
            {
                return BadRequest();
            }

            return Ok(messages);

        }

        public IHttpActionResult PostMessage(MessageModel message)
        {
            var sender = db.Users.FirstOrDefault(u => u.UserName == message.SenderUserName);
            var newMessage = new Message()
            {
                Text = message.Message,
                DateTime = message.DateSent,
                UserId = sender.Id
            };

            db.Messages.Add(newMessage);
            db.SaveChanges();
            return Ok(message);
        }
    }
}
