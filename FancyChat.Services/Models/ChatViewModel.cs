﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FancyChat.Services.Models
{
    public class ChatViewModel
    {
        public int Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string ChatPartner { get; set; }
    }
}