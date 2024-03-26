//Iniciación de Express
//Crear el servidor
const express = require('express')
const PDFDocument = require('pdfkit');
const fs = require('fs')
const {leerArchivo,escribirArchivo} =  require('./src/files')

const app = express()

app.use(express.json())

//---------------- RUTAS -----------------------

app.get('/',(req,res)=>{
    res.send('Hello World')
})

//Rutas INDEX
app.get('/motos',(req,res)=>{
    const Motos = leerArchivo('./db.json')
    //res.send(Motos)
    
        // Crear un documento PDF
        const doc = new PDFDocument();

        // Configurar el tipo de contenido y el encabezado para la respuesta HTTP
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="motos.pdf"');
    
        // Escribir la información de las motos en el PDF
        doc.pipe(res);
        doc.fontSize(20).text('Lista de Motos\n\n');
        Motos.forEach(moto => {
            //doc.fontSize(14).text(`Marca: ${moto.brand}, Modelo: ${moto.model}, Año: ${moto.release_date}\n\n`);
            doc.fontSize(14).text(`${moto.brand}, ${moto.model}, ${moto.engine_displacement_cc}cc\n\n`);
        });
    
        // Finalizar el documento PDF
        doc.end();
})

//Rutas SHOW
app.get('/motos/:id',(req,res)=>{
    const id = req.params.id
    const Motos = leerArchivo('./db.json')
    const moto = Motos.find(moto=>moto.id===parseInt(id))
    //NO EXISTE
    if(!moto) {
        res.status(404).send('No existe la moto')
        return
    }
    //EXISTE
    res.send(moto)
    console.log('Moto encontrada')
})

//Rutas STORE
app.post('/motos',(req,res)=>{
    const moto = req.body
    const Motos = leerArchivo('./db.json')
    moto.id = Motos.length + 1
    Motos.push(moto)
    //Escribir archivo
    escribirArchivo('./db.json',Motos)
    res.status(201).send(moto)
})

// Rutas UPDATE
app.put('/motos/:id', (req, res) => {
    const id = req.params.id;
    const newData = req.body;
    let Motos = leerArchivo('./db.json');

    // Buscar la moto por su ID
    const motoIndex = Motos.findIndex(moto => moto.id === parseInt(id));

    // Si no se encuentra la moto, devolver un error 404
    if (motoIndex === -1) {
        res.status(404).send('No existe la moto');
        return;
    }

    // Actualizar los datos de la moto con los nuevos datos
    Motos[motoIndex] = {
        ...Motos[motoIndex], // Conservar los datos existentes
        ...newData // Sobrescribir con los nuevos datos
    };

    // Escribir los datos actualizados en el archivo
    escribirArchivo('./db.json', Motos);

    // Devolver la moto actualizada
    res.send(Motos[motoIndex]);
    console.log(`Moto con ID ${id} actualizada exitosamente.`)
});


// Rutas DESTROY
app.delete('/motos/:id', (req, res) => {
    const id = req.params.id;
    let Motos = leerArchivo('./db.json');

    // Buscar la moto por su ID
    const motoIndex = Motos.findIndex(moto => moto.id === parseInt(id));

    // Si no se encuentra la moto, devolver un error 404
    if (motoIndex === -1) {
        res.status(404).send('No existe la moto');
        return;
    }

    // Eliminar la moto de la lista
    Motos = Motos.filter(moto => moto.id !== parseInt(id));

    // Escribir los datos actualizados en el archivo
    escribirArchivo('./db.json', Motos);

    // Devolver un mensaje de éxito
    res.send(`Moto con ID ${id} eliminada exitosamente.`);
});











//Levantando el servidor para esuchar por el puerto 3000
app.listen(3000,()=>{
    console.log('Listening on port 3000')
})

