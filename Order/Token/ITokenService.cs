using Microsoft.AspNetCore.Identity;

namespace Order.Services
{
    public interface ITokenService
    {
        string CreateToken(IdentityUser user);
    }
}