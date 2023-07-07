import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity({
    name: 'product_images'
})
export class ProductImage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    url: string;

    // Referencia a la tabla product
    @ManyToOne(
        () => Product,
        (product) => product.images,
        // Cuando el producto se elimine hacer borrado de imagenes en cascada
        {onDelete: 'CASCADE'}
    )
    product: Product
}