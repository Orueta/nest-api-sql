import { join } from 'path';
import { existsSync } from 'fs';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {

    getStaticProductImage(imageName: string) {
        // comprobar que la imagen este alojada en el path
        const path = join(__dirname, '../../static/products', imageName);

        //verificar que el archivo existga sin importar el tipado
        if (!existsSync(path)) 
            throw new BadRequestException(`No product found with image ${imageName}`);
        
        return path;
    }

}
