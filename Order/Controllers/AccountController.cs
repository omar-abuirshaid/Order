using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Order.DTOs;
using Order.DTOs;
using Order.Services;
using Order.DTOs;

namespace Order.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ITokenService _tokenService;

        public AccountController(
            UserManager<IdentityUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ITokenService tokenService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = new IdentityUser
            {
                UserName = dto.Username,
                Email = dto.Email
            };

            var createdUser = await _userManager.CreateAsync(user, dto.Password);

            if (!createdUser.Succeeded)
                return BadRequest(createdUser.Errors);

            // التأكد من وجود دور User وإنشائه إذا لم يكن موجوداً
            if (!await _roleManager.RoleExistsAsync("User"))
            {
                await _roleManager.CreateAsync(new IdentityRole("User"));
            }

            // إعطاء المستخدم الجديد دور "User" بشكل افتراضي
            await _userManager.AddToRoleAsync(user, "User");

            var token = await _tokenService.CreateToken(user, _userManager);

            return Ok(new UserResponseDto
            {
                Username = user.UserName,
                Email = user.Email,
                Token = token
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(dto.Email);

            if (user == null)
                return Unauthorized("Invalid email or password!");

            var result = await _userManager.CheckPasswordAsync(user, dto.Password);

            if (!result)
                return Unauthorized("Invalid email or password!");

            var token = await _tokenService.CreateToken(user, _userManager);

            return Ok(new UserResponseDto
            {
                Username = user.UserName!,
                Email = user.Email!,
                Token = token
            });
        }
    }
}