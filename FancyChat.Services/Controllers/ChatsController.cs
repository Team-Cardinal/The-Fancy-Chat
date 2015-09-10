using FancyChat.Data;
using FancyChat.Models;
using FancyChat.Services.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace FancyChat.Services.Controllers
{
    public class ChatsController : ApiController
    {
        private FancyChatContext db = FancyChatContext.Create();

        [HttpGet]
        [Authorize]
        //GET /api/chats/{username}
        [Route("api/chats/{username}")]
        public IHttpActionResult GetAllChats(string username)
        {
            var activeChats = new List<ChatViewModel>();

            var chats = db.Chats.Where(c => c.Users.Any(u => u.UserName == username))
                            .Select(ch => new
                            {
                                ch.Id,
                                ch.Name,
                                ch.CreatedOn
                            }).AsQueryable();

            foreach (var chat in chats)
            {
                var participants = chat.Name.Split();

                if (participants[0] == username)
                {
                    var currActiveChat = new ChatViewModel
                    {
                        Id = chat.Id,
                        CreatedOn = chat.CreatedOn,
                        ChatPartner = participants[1]
                    };

                    activeChats.Add(currActiveChat);
                }
                else
                {
                    var currActiveChat = new ChatViewModel
                    {
                        Id = chat.Id,
                        CreatedOn = chat.CreatedOn,
                        ChatPartner = participants[0]
                    };

                    activeChats.Add(currActiveChat);
                }
            }

            return this.Ok(activeChats);
        }

        [HttpGet]
        [Authorize]
        //GET /api/chats/{chatId}
        [Route("api/chats/{username}/{chatId}")]
        public IHttpActionResult GetPrivateChat(string username, int chatId)
        {


            var currentChatMessages = db.PrivateMessages
                                        .Where(m => m.ChatId == chatId)
                                        .Select(m => new PrivateMessageViewModel
                                        {
                                            Name = m.Sender.UserName,
                                            MessageContent = m.Text
                                        }).AsQueryable();

            return this.Ok(currentChatMessages);
        }


        //POST /api/chats
        [HttpPost]
        [Authorize]
        [Route("api/chats")]
        public IHttpActionResult CreateChat(ChatBindingModel newChat)
        {
            ApplicationUser currUser = db.Users.FirstOrDefault(u => u.UserName == newChat.CurrentUser);
            ApplicationUser chatPartner = db.Users.FirstOrDefault(u => u.UserName == newChat.ChatPartner);

            if (chatPartner == null)
            {
                return this.NotFound();
            }

            if (currUser.UserName == chatPartner.UserName)
            {
                return this.BadRequest("You cannot start chat with yourself.");
            }

            string newChatName = currUser.UserName + " " + chatPartner.UserName;
            string newChatNameAlt = chatPartner.UserName + " " + currUser.UserName;

            if (!(db.Chats.Any(c => c.Name == newChatName || c.Name == newChatNameAlt) ||
                db.Chats.Any(c => c.AlternativeName == newChatName || c.AlternativeName == newChatNameAlt)))
            {
                var chat = new Chat()
                {
                    Name = newChatName,
                    AlternativeName = newChatNameAlt,
                    CreatedOn = DateTime.Now,
                };

                chat.Users.Add(currUser);
                chat.Users.Add(chatPartner);

                db.Chats.Add(chat);
                db.SaveChanges();
            }
            else
            {
                return this.BadRequest("Chat already exists.");
            }

            var createdChat = db.Chats.OrderByDescending(ch => ch.CreatedOn)
                                    .FirstOrDefault();

            var chatToReturn = new ChatViewModel
            {
                Id = createdChat.Id,
                CreatedOn = createdChat.CreatedOn,
                ChatPartner = chatPartner.UserName
            };

            return this.Ok(chatToReturn);
        }

        [HttpPost]
        [Authorize]
        //POST /api/chats/{username}/{chatId}
        [Route("api/chats/{username}/{chatId}")]
        public IHttpActionResult PostPrivateChatMessage(PrivateMessageBindingModel model)
        {
            ApplicationUser sender = db.Users.FirstOrDefault(u => u.UserName == model.Sender);

            var message = new PrivateMessage()
            {
                Text = model.Content,
                DateTime = DateTime.Now,
                ChatId = model.ChatId,
                SenderId = sender.Id
            };

            db.PrivateMessages.Add(message);
            db.SaveChanges();

            return this.Ok();
        }

       
    }
}
