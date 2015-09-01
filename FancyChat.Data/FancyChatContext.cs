using System.Data.Entity;
using FancyChat.Models;
using Microsoft.AspNet.Identity.EntityFramework;

namespace FancyChat.Data
{
  
    public class FancyChatContext : IdentityDbContext<ApplicationUser>
    {
        public FancyChatContext()
            : base("name=FancyChatContext", throwIfV1Schema: false)
        {
        }

        public static FancyChatContext Create()
        {
            return new FancyChatContext();
        }

        public IDbSet<PublicMessage> PublicMessages { get; set; }
        public IDbSet<PrivateMessage> PrivateMessages { get; set; }
    }
}