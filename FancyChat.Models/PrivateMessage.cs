﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FancyChat.Models
{
    public class PrivateMessage 
    {
        public int Id { get; set; }
        public string Text { get; set; }
        public DateTime DateTime { get; set; }
        public string SenderId { get; set; }
        [ForeignKey("SenderId")]
        public virtual ApplicationUser User { get; set; }
        public string RecieverId { get; set; }
        [ForeignKey("RecieverId")]
        public ApplicationUser Reciever { get; set; }
    }
}