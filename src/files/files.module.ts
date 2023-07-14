import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [
    // Para poder utilizar el config service en el controlador. Hay que importar:
    ConfigModule
  ]
})
export class FilesModule {}
