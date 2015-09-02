using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FancyChat.Models
{
    public class PublicMessage
    {
        public int Id { get; set; }
        public string Text { get; set; }
        public DateTime DateTime { get; set; }

        public string SenderId { get; set; }
        [ForeignKey("SenderId")]
        public virtual ApplicationUser Sender { get; set; }
    }
}
