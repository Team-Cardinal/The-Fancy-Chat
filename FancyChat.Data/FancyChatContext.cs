namespace FancyChat.Data
{
    using FancyChat.Data.Migrations;
    using FancyChat.Models;
    using Microsoft.AspNet.Identity.EntityFramework;
    using System.Data.Entity;

    public class FancyChatContext : IdentityDbContext<ApplicationUser>
    {
        public FancyChatContext()
            : base("name=FancyChatContext", throwIfV1Schema: false)
        {
            Database.SetInitializer(new MigrateDatabaseToLatestVersion<FancyChatContext, Configuration>());
        }

        public static FancyChatContext Create()
        {
            return new FancyChatContext();
        }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Chat>()
                .HasMany(u => u.Users);

            modelBuilder.Entity<ApplicationUser>()
                .HasMany(c => c.Chats);

            modelBuilder.Entity<Chat>()
                .HasMany(m => m.Messages);

            base.OnModelCreating(modelBuilder);
        }

        public  IDbSet<PublicMessage> PublicMessages { get; set; }
        public IDbSet<PrivateMessage> PrivateMessages { get; set; }
        public IDbSet<Chat> Chats { get; set; }
        public IDbSet<OnlineUser> OnlineUsers { get; set; }
    }
}