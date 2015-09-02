using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FancyChat.Services.Models
{
    public class ChatBindingModel
    {
        public string Name { get; set; }

        public DateTime CreatedOn { get; set; }

        public string CurrentUser { get; set; }

        public string ChatPartner { get; set; }
    }
}