import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';


@Injectable()
export class SeedService {
  
  constructor(
    private readonly productsService: ProductsService,
  ) {}


  async runSeed() {
    await this.insertNewProducts();
  }

  private async insertNewProducts() {
    // Llamar el borrado de los productos
    await this.productsService.deleteAllProducts();
    
    const products = initialData.products;

    const insertPromises = [];

    // Pushear cada promesa al rreglo y crear los productos
    products.forEach(product => {
      insertPromises.push(this.productsService.create(product));
    });

    // Esperar a que todas las promesas se resuelvan
    await Promise.all(insertPromises);

    return true;

  }

}
