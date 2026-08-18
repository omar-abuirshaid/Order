namespace Order.Enums
{
    public enum OrderStatus
    {
        Pending = 0,            // قيد الانتظار
        InventoryChecking = 1,  // جاري التحقق من المخزون
        Confirmed = 2,          // تم التأكيد
        Completed = 3,          // مكتمل
        Rejected = 4            // مرفوض
    }
}