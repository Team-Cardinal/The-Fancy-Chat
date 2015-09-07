using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FancyChat.Models
{
    public class Chat
    {
        private ICollection<ApplicationUser> users;
        private ICollection<PrivateMessage> messages;

        public Chat()
        {
            this.users = new HashSet<ApplicationUser>();
            this.messages = new HashSet<PrivateMessage>();
        }

        [Key]
        public int Id { get; set; }

        public string Name { get; set; }

        public string AlternativeName { get; set; }

        public DateTime CreatedOn { get; set; }

        public virtual ICollection<ApplicationUser> Users
        {
            get { return this.users; }
            set { this.users = value; }
        }

        public virtual ICollection<PrivateMessage> Messages
        {
            get { return this.messages; }
            set { this.messages = value; }
        }
    }
}