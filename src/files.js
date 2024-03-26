const fs = require('fs');

function leerArchivo(path){
    const data = fs.readFileSync(path);
    const Motos = JSON.parse(data).Motos;
    return Motos;
}

function escribirArchivo(path,info){
    const data = JSON.stringify({'Motos':info});
    fs.writeFileSync(path, data);
}

module.exports = {
    leerArchivo,
    escribirArchivo
}