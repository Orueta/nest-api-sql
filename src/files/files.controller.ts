import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { FilesService } from './files.service';
import { fileFilter, fileNamer } from './helpers';
import { ConfigService } from '@nestjs/config';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    // Acceso a las variables de entorno
    private readonly configServices: ConfigService
  ) {}
  
  // Servir imagenes
  @Get('product/:imageName')
  findProductImage(
    // Regresar la imagen en lugar del path
    @Res() res: Response,
    @Param('imageName') imageName: string
  ) {
    // Verificar que el fileSystem exista la imagen
    const path = this.filesService.getStaticProductImage(imageName);

    // res.status(403).json({
    //   ok: false,
    //   path,
    // });

    // Devolver la imagen que solicitaron
    res.sendFile(path);

  }


  // Subida de archivos
  @Post('product')
  // Interceptores, interceptan las solicitudes y tambien pueden inmutar las respuestas
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: fileFilter,
    // limits: {fieldSize: 1000}
    // Guardar imagenes en el servidor
    storage: diskStorage({
      destination: './static/products',
      filename: fileNamer
    })
  }))
  uploadImages(@UploadedFile() file: Express.Multer.File){

    if (!file) {
      throw new BadRequestException('Make sure that file is an image');
    }

    // HOST_API para indicar el url del api donde esta la imagen
    const secureUrl = `${this.configServices.get('HOST_API')}/files/product/${file.filename}`;
    
    return {secureUrl};
  }
  


}
