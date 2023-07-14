
// Evaluar que el tipo de archivo que sube el usuario sea valido
export const fileFilter = (req: Express.Request, file: Express.Multer.File, callback: Function) => {

    // verificar que el archivo exista
    if (!file) return callback(new Error('File is empty'), false)

    const fileExtension = file.mimetype.split('/')[1];
    const validExtensions = ['jpg','jpeg','png','gif'];

    if (validExtensions.includes(fileExtension)) {
        return callback(null, true);
    }


    callback(null, false);
}