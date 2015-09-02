using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.EntityFramework;

namespace FancyChat.Models
{
    public class ApplicationUser : IdentityUser
    {
        public ApplicationUser()
        {
            this.PublicMessages = new HashSet<PublicMessage>();
            this.PrivateMessages = new HashSet<PrivateMessage>();
        }
        public async Task<ClaimsIdentity> GenerateUserIdentityAsync(UserManager<ApplicationUser> manager, string authenticationType)
        {
            // Note the authenticationType must match the one defined in CookieAuthenticationOptions.AuthenticationType
            var userIdentity = await manager.CreateIdentityAsync(this, authenticationType);
            // Add custom user claims here
            return userIdentity;
        }
<<<<<<< HEAD

        public virtual ICollection<PublicMessage> Messages { get; set; }

        public virtual ICollection<Chat> Chats { get; set; }
=======
        public virtual ICollection<PublicMessage> PublicMessages { get; set; }
        public virtual ICollection<PrivateMessage> PrivateMessages { get; set; }
>>>>>>> 3ecfc5658b753ed01eff859ff33d187819507a00
    }      
}
