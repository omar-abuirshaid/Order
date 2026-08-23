using Microsoft.AspNetCore.Identity;

namespace Order.Services
{
    public interface ITokenService
    {
        Task<string> CreateToken(IdentityUser user, UserManager<IdentityUser> userManager);
    }
}