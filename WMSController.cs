using Microsoft.AspNetCore.Mvc;
using Dapper;
using SmartWMS.Data;
using SmartWMS.Models;

namespace SmartWMS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WMSController : ControllerBase
    {
        private readonly AppDbContext _db;

        public WMSController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public IActionResult Test()
        {
            return Ok("WMS Server Running ");
        }

        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventory()
        {
            using var conn = _db.CreateConnection();
            var data = await conn.QueryAsync("SELECT * FROM products ORDER BY p_sku ASC");
            return Ok(data);
        }

        // Add product
        [HttpPost("add-product")]
        public async Task<IActionResult> AddProduct(Product p)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(@"
                INSERT INTO products (p_sku, p_name, p_quantity, p_price)
                VALUES (@Sku, @Name, @Qty, @Price)
                ON CONFLICT (p_sku)
                DO UPDATE SET 
                  p_quantity = products.p_quantity + @Qty,
                  p_price = @Price
            ", p);
            return Ok("Product Added ");
        }

        // FIX: Added PUT handler for updating qty and price
        [HttpPut("add-product")]
        public async Task<IActionResult> UpdateProduct(Product p)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(@"
                UPDATE products
                SET p_quantity = @Qty,
                    p_price = @Price
                WHERE p_sku = @Sku
            ", p);
            return Ok("Product Updated ");
        }

        // Set or update Product location
        [HttpPost("set-location")]
        public async Task<IActionResult> SetLocation(ProductLocation pl)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(@"INSERT INTO item_location (p_id, in_bim, in_rack_no, in_r_column, in_r_row)
                SELECT 
                    p.p_id,
                    @Bim,
                    @RackNo,
                    @RColumn,
                    @RRow
                FROM products p
                WHERE p.p_sku = @Sku
                ON CONFLICT (p_id) DO UPDATE SET 
                    in_bim = EXCLUDED.in_bim,
                    in_rack_no = EXCLUDED.in_rack_no,
                    in_r_column = EXCLUDED.in_r_column,
                    in_r_row = EXCLUDED.in_r_row
                ", pl);

            return Ok("Location Set ");
        }

        [HttpPost("dispatch")]
        public async Task<IActionResult> Dispatch(Product p)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "UPDATE products SET p_quantity = p_quantity - @Qty WHERE p_sku = @Sku",
                p
            );
            return Ok("Product Dispatched ");
        }

        [HttpGet("location/{sku}")]
        public async Task<IActionResult> GetLocation(string sku)
        {
            using var conn = _db.CreateConnection();
            var data = await conn.QueryAsync(@"
                SELECT p.p_sku, il.in_bim, il.in_rack_no, il.in_r_column, il.in_r_row 
                FROM item_location il
                JOIN products p ON il.p_id = p.p_id
                WHERE p.p_sku = @sku
            ", new { sku });
            return Ok(data);
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders()
        {
            using var conn = _db.CreateConnection();
            var data = await conn.QueryAsync(@"
                SELECT c.cust_name, o.ord_date, p.p_sku, p.p_name, p.p_price,
                       oi.item_quantity, (p.p_price * oi.item_quantity) AS total_price
                FROM order_items oi
                JOIN products p ON oi.p_id = p.p_id
                JOIN orders o ON oi.ord_id = o.ord_id
                JOIN cust c ON o.cust_id = c.cust_id
            ");
            return Ok(data);
        }

        
        //  FIX 1: Delete from item_location first (FK constraint), then products
        [HttpDelete("delete-product/{sku}")]
        public async Task<IActionResult> DeleteProduct(string sku)
        {
            using var conn = _db.CreateConnection();
            await conn.ExecuteAsync(
                "DELETE FROM item_location WHERE p_id = (SELECT p_id FROM products WHERE p_sku = @sku)",
                new { sku });
            await conn.ExecuteAsync("DELETE FROM products WHERE p_sku = @sku", new { sku });
            return Ok("Product Deleted ");
        }
    }
}