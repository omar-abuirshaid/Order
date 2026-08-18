using Order.DTOs;
using Order.Enums;
using Order.Model;

namespace Order.Mappings
{
    public class OrderMapper
    {
        private readonly OrderItemMapper _itemMapper = new OrderItemMapper();

        public OrderEntity ToEntity(CreateOrderDto dto)
        {
            var entity = new OrderEntity
            {
                CustomerId = dto.CustomerId,
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.Pending,
                OrderItems = dto.Items.Select(item => _itemMapper.ToEntity(item)).ToList()
            };

            entity.TotalAmount = entity.OrderItems.Sum(i => i.TotalPrice);
            return entity;
        }

        public OrderResponseDto ToDto(OrderEntity entity)
        {
            return new OrderResponseDto
            {
                Id = entity.Id,
                CustomerId = entity.CustomerId,
                OrderDate = entity.OrderDate,
                TotalAmount = entity.TotalAmount,
                Status = entity.Status,
                Items = entity.OrderItems.Select(item => _itemMapper.ToDto(item)).ToList()
            };
        }
    }
}