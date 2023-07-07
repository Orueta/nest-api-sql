import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';


import { ProductImage,Product } from './entities';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class ProductsService {

  // Modificar los logs de consola
  private readonly logger = new Logger('ProductsService');

  constructor(
    // Inyectar el repositorio para poder interactuar con las tablas de la db
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ) {}
  
  async create(createProductDto: CreateProductDto) {
    
    try {
      
      // extraer imagenes del dto
      const {images = [], ...productDetails} = createProductDto;

      // Registrar data con el repositorio (Crea la instacial de producto con sus propiedades)
      const product = this.productRepository.create({
        ...productDetails,
        // Registrar imagenes al crear un producto
        images: images.map(image => this.productImageRepository.create({url: image}))
      });
      // Registrar data en la db
      await this.productRepository.save(product);

      return {...product, iamges: images};
      
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const {limit = 10, offset = 0} = paginationDto;

    const products = await this.productRepository.find({
      take:limit,
      skip: offset,
      relations: {
        images: true,
      }
    });

    return products.map((product) => ({
      ...product,
      images: product.images.map(img => img.url)
    }));
  }

  async findOne(term: string) {
    
    let product: Product;
    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({id: term});
    } else {
      // Para hacer un query sql a la db
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      // WHERE a la base de datos para obtener el titulo o el slug
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        // cargar la relacion hecha con el query builder
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }

    // const product = await this.productRepository.findOneBy({id});

    if (!product) throw new NotFoundException(`Product with id ${term} not found`);

    return product;

  }

  async findOnePlain(term: string) {
    const {images = [], ...rest} = await  this.findOne(term);
    return {
      ...rest,
      images: images.map(image => image.url)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const {images, ...toUpdate} = updateProductDto;
    
    const product = await this.productRepository.preload({
      id,
      ...toUpdate
    });

    if (!product) throw new NotFoundException(`Product with id: ${id} not found`);

    // Si tenemos el producto en la db. (Evaluación para verificar si se estan actualizando imagenes)
    // Create Query runner (para ejecutar multiples sentencias sql a la vez hasta que ocurra la transanccion)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Manejo de errores
    try {
      // Si vienen las imagenes se borran las anteriores
      if (images) {
        // Solo eliminaremos las imagenes del producto en base a su id
        await queryRunner.manager.delete(ProductImage, {product: {id}});

        // crear en memoria el registro de las nuevas iamgenes
        product.images = images.map(
          image => this.productImageRepository.create({url: image})
        );
      }
      // Guardar cambios
      // await this.productRepository.save(product);
      
      // impactar el guardado de las imagenes en base de datos
      await queryRunner.manager.save(product);

      // revisar el commit de la transaccion para aplicar los cambios
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain(id)

    } catch (error) {

      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    
    await this.productRepository.remove(product);

    return product;
  }

  async deleteAllProducts() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();
        
    } catch (error) {
      this.handleDBExceptions(error);
    }

  }  

  private handleDBExceptions(error: any) {
    // Mostrar errores en consola con el logger
    if (error.code === '23505')
      throw new BadRequestException(error.detail);

    this.logger.error(error)
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}