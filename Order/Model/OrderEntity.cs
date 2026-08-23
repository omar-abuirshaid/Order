using Microsoft.AspNetCore.Identity;
using Order.Enums;

namespace Order.Model
{
    public class OrderEntity
    {
        public int Id { get; set; }

        // ربط الطلب بمستخدم النظام (Identity)
        public string UserId { get; set; } = string.Empty;
        public IdentityUser? User { get; set; }

        // إذا كنت تستخدم جدول Customer مستقلاً بجانب المستخدمين
        public int? CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public decimal TotalAmount { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        public List<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}