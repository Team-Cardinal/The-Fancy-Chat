using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FancyChat.Services.Models
{
    public class MessageModel
    {

        public string SenderUserName { get; set; }

        public string Text { get; set; }
        public DateTime DateSent { get; set; }


    }
}