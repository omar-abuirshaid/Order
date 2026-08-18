using Order.DTOs;
using Order.Model;

namespace Order.Mappings
{
    public class OrderItemMapper
    {
        public OrderItem ToEntity(CreateOrderItemDto dto)
        {
            return new OrderItem
            {
                ProductId = dto.ProductId,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice,
                TotalPrice = dto.Quantity * dto.UnitPrice
            };
        }

        public OrderItemResponseDto ToDto(OrderItem entity)
        {
            return new OrderItemResponseDto
            {
                Id = entity.Id,
                ProductId = entity.ProductId,
                Quantity = entity.Quantity,
                UnitPrice = entity.UnitPrice,
                TotalPrice = entity.TotalPrice
            };
        }
    }
}