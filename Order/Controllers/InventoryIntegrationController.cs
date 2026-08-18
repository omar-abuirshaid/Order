using Microsoft.AspNetCore.Mvc;

namespace Order.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryIntegrationController : ControllerBase
    {
        private readonly HttpClient _httpClient;

        public InventoryIntegrationController(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient();
        }

        // التحقق من توفر الكمية لمنتج مع في نظام المخزن الخارجي
        [HttpGet("check-stock/{productId}")]
        public async Task<IActionResult> CheckStock(int productId, [FromQuery] int quantity)
        {
            // هنا سيتم إرسال Request لنظام الـ Inventory المربوط معك
            // مثال: var response = await _httpClient.GetAsync($"https://inventory-api/stock/{productId}");

            return Ok(new
            {
                ProductId = productId,
                RequestedQuantity = quantity,
                IsAvailable = true,
                Message = "Product quantity is available in stock."
            });
        }
    }
}