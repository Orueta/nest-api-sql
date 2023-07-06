import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';


import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class ProductsService {

  // Modificar los logs de consola
  private readonly logger = new Logger('ProductsService');

  constructor(
    // Inyectar el repositorio para poder hacer el post desde allí
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
  
  async create(createProductDto: CreateProductDto) {
    
    try {
      // Registrar data con el repositorio (Crea la instacial de producto con sus propiedades)
      const product = this.productRepository.create(createProductDto);
      // Registrar data en la db
      await this.productRepository.save(product);

      return product;
      
    } catch (error) {
      this.handleDBExceptions(error);
    }
    
  }

  findAll(paginationDto: PaginationDto) {
    const {limit = 10, offset = 0} = paginationDto;

    return this.productRepository.find({
      take:limit,
      skip: offset,
      // Todo: relaciones
    });
  }

  async findOne(term: string) {
    
    let product: Product;
    if (isUUID(term)) {
      product = await this.productRepository.findOneBy({id: term});
    } else {
      // Para hacer un query sql a la db
      const queryBuilder = this.productRepository.createQueryBuilder();
      // WHERE a la base de datos para obtener el titulo o el slug
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        }).getOne();
    }

    // const product = await this.productRepository.findOneBy({id});

    if (!product) throw new NotFoundException(`Product with id ${term} not found`);

    return product;

  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto
    });

    if (!product) throw new NotFoundException(`Product with id: ${id} not found`);

    // Manejo de errores
    try {
      // Guardar cambios
      await this.productRepository.save(product);
      return product;

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    
    await this.productRepository.remove(product);

    return product;
  }

  private handleDBExceptions(error: any) {
    // Mostrar errores en consola con el logger
    if (error.code === '23505')
      throw new BadRequestException(error.detail);

    this.logger.error(error)
    throw new InternalServerErrorException('Unexpected error, check server logs');
  }
}