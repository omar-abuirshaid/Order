using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Order.Data;
using Order.DTOs;
using Order.Enums;
using Order.Mapper;
using Order.Mappings;

namespace Order.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly OrderMapper _orderMapper;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
            _orderMapper = new OrderMapper();
        }

        // جلب كافة الطلبات (مع إمكانية الفلترة بحالة الطلب)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderResponseDto>>> GetOrders([FromQuery] OrderStatus? status)
        {
            var query = _context.Orders.Include(o => o.OrderItems).AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(o => o.Status == status.Value);
            }

            var orders = await query.ToListAsync();
            return Ok(orders.Select(o => _orderMapper.ToDto(o)).ToList());
        }

        // جلب تفاصيل طلب واحد
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderResponseDto>> GetOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound($"Order with ID {id} not found.");

            return Ok(_orderMapper.ToDto(order));
        }

        // إنشاء طلب جديد بكامل عناصره
        [HttpPost]
        public async Task<ActionResult<OrderResponseDto>> CreateOrder([FromBody] CreateOrderDto dto)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.Id == dto.CustomerId);
            if (!customerExists)
            {
                return BadRequest($"Customer with ID {dto.CustomerId} does not exist.");
            }

            var orderEntity = _orderMapper.ToEntity(dto);

            _context.Orders.Add(orderEntity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrder), new { id = orderEntity.Id }, _orderMapper.ToDto(orderEntity));
        }

        // تحديث حالة الطلب (Status)
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] OrderStatus newStatus)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound($"Order with ID {id} not found.");

            order.Status = newStatus;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // حذف عنصر محدد من داخل الطلب وإعادة حساب الإجمالي تلقائياً
        [HttpDelete("{orderId}/items/{itemId}")]
        public async Task<IActionResult> RemoveItemFromOrder(int orderId, int itemId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) return NotFound($"Order with ID {orderId} not found.");

            var item = order.OrderItems.FirstOrDefault(i => i.Id == itemId);
            if (item == null) return NotFound($"Item with ID {itemId} not found in this order.");

            _context.OrderItems.Remove(item);

            // إعادة حساب إجمالي الطلب لحماية Data Integrity
            order.TotalAmount = order.OrderItems.Where(i => i.Id != itemId).Sum(i => i.TotalPrice);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // حذف الطلب بالكامل
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound($"Order with ID {id} not found.");

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}