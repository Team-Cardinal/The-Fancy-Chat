using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FancyChat.Services.Models
{
    public class PrivateMessageBindingModel
    {
        public int ChatId { get; set; }
        public string Content { get; set; }
        public string Sender { get; set; }
    }
}