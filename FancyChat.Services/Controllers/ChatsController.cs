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
        //GET /api/chats/{username}
        [Route("api/chats/{username}")]
        public IHttpActionResult GetAllChats(string username)
        {
            var chats = db.Chats.Where(c => c.Users.Any(u => u.UserName == username))
                            .Select(ch => new {
                                ch.Id,
                                ch.Name,
                                ch.CreatedOn
                            }).AsQueryable();

            return this.Ok(chats);
        }

        [HttpGet]
        //GET /api/chats/{username}/{chatId}
        public IHttpActionResult GetSpecificChat()
        {
            throw new NotImplementedException();
        }


        //POST /api/chats
        [HttpPost]
        [Route("api/chats")]
        public IHttpActionResult CreateChat(ChatBindingModel newChat)
        {
            ApplicationUser currUser = db.Users.FirstOrDefault(u => u.UserName == newChat.CurrentUser);
            ApplicationUser chatPartner = db.Users.FirstOrDefault(u => u.UserName == newChat.ChatPartner);

            var chat = new Chat()
            {
                Name = newChat.Name,
                CreatedOn = DateTime.Now,
            };

            chat.Users.Add(currUser);
            chat.Users.Add(chatPartner);

            db.Chats.Add(chat);
            db.SaveChanges();

            return this.Ok();
        }

        [HttpPost]
        //POST /api/{user}/chats/{chatId}
        public IHttpActionResult PostChatMessage()
        {
            throw new NotImplementedException();
        }
    }
}
