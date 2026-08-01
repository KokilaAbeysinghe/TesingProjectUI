# TestingProjectUI

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.1.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

report controller.cs
[HttpGet("low-stock")]
public async Task<IActionResult> GetLowStockProducts(int level = 10)
{
    var lowStockProducts = await _reportService.GetLowStockProducts(level);
    return Ok(lowStockProducts);
}
Ireportservice
Task<List<LowStockProductDTO>> GetLowStockProducts(int level);

report service
private const int LowStockReorderLevel = 10;- delete
176-193
public async Task<List<LowStockProductDTO>> GetLowStockProducts(int level)
{
    var products = await _productRepository.GetAllProducts();

    var lowStockProducts = products
        .Where(product => product.Stock <= level)
        .OrderBy(product => product.Stock)
        .Select(product => new LowStockProductDTO
        {
            ProductName = product.Name,
            CurrentStock = product.Stock,
            ReorderLevel = level,
            Status = product.Stock == 0 ? "Out of Stock" : "Low Stock"
        })
        .ToList();

    return lowStockProducts;
}
ui ts 37 39
getLowStockProducts(level: number = 10): Observable<LowStockProduct[]> {
  return this.#http.get<LowStockProduct[]>(`${this.#baseUrl}/low-stock`, {
    params: { level: level.toString() }
  });
}
component ts 110
lowStockProducts: this.#reportService.getLowStockProducts(this.lowStockLevel())
readonly lowStockLevel = signal(10);
updateLowStockLevel(value: number): void {
  this.lowStockLevel.set(value);
}
html 203 205
<label for="lowStockLevel">Level</label>
<input
  id="lowStockLevel"
  type="number"
  [value]="lowStockLevel()"
  (change)="updateLowStockLevel(+$any($event.target).value)"
/>



<select [value]="selectedStatus()" (change)="updateStatusFilter($any($event.target).value)">
  <option value="All">All</option>
  <option value="Completed">Completed</option>
  <option value="Voided">Voided</option>
</select>
this.sales.set(result.items.filter(s => 
  this.selectedStatus() === 'All' || s.status === this.selectedStatus()
));
updateStatusFilter(status: string): void {
  this.selectedStatus.set(status);
  this.currentPage.set(1);
  this.loadSales();
}