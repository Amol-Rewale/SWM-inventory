// Models/Product.cs
namespace SmartWMS.Models
{
    public class Product
    {
        public string? Sku { get; set; }   // lowercase 'sku' → 'Sku'
        public string? Name { get; set; }  // 'name' → 'Name'
        public int Qty { get; set; }       // 'qty' → 'Qty'
        public decimal Price { get; set; } // 'price' → 'Price'
    }

    public class ProductLocation
    {
        public string? Sku { get; set; }   // lowercase 'sku' → 'Sku'
        public string? Bim { get; set; }   // 'in_bim' → 'Bim'
        public string? RackNo { get; set; } // 'in_rack_no' → 'RackNo'
        public string? RColumn { get; set; } // 'in_r_column' → 'RColumn'
        public string? RRow { get; set; }    // 'in_r_row' → 'RRow'
    }   
}