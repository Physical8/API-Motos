//Iniciación de Express
//Crear el servidor
const express = require('express')
const PDFDocument = require('pdfkit');
const Joi = require('joi');
const moment = require('moment');
const fs = require('fs')
const {leerArchivo,escribirArchivo} =  require('./src/files')


const app = express()

app.use(express.json())

// Middleware para el registro de solicitudes
app.use((req, res, next) => {
    // Obtener la información de la solicitud
    const fechaActual = moment().format('DD/MM/YYYY HH:mm:ss');
    const tipoMetodoHTTP = req.method;
    const url = req.originalUrl;
    const queryParams = JSON.stringify(req.query);
    const body = JSON.stringify(req.body);
    const ip = req.ip;

    // Construir la línea de registro
    const logLine = `${fechaActual} [${tipoMetodoHTTP}] ${url} ${queryParams} ${body} ${ip}\n`;

    // Registrar la línea en el archivo access_log.txt
    fs.appendFile('access_log.txt', logLine, (err) => {
        if (err) {
            console.error('Error al escribir en el archivo access_log.txt:', err);
        }
    });

    // Pasar al siguiente middleware
    next();
});

// Middleware para agregar el campo created_at al cuerpo de la solicitud
const agregarCreatedAt = (req, res, next) => {
    // Obtener la fecha y hora actual en el formato especificado
    const currentDateTime = moment().format('YYYY-MM-DD hh:mm');

    // Agregar el campo created_at al cuerpo de la solicitud
    req.body.created_at = currentDateTime;

    // Pasar al siguiente middleware
    next();
};

const schema = Joi.object({
    brand: Joi.string().min(2).max(50).required(), // Validación adicional para longitud del nombre de marca
    model: Joi.string().min(2).max(50).required(), // Validación adicional para longitud del modelo
    engine_displacement_cc: Joi.number().integer().min(50).required(), // Validación adicional para el desplazamiento del motor
    release_date: Joi.date().iso().required(), // Validación adicional para la fecha de lanzamiento
    top_speed_kmh: Joi.number().integer().min(50).required(), // Validación adicional para la velocidad máxima
    price_usd: Joi.number().positive().required(), // Validación adicional para el precio en USD
    is_street_legal: Joi.boolean().required(), // Validación adicional para la legalidad en calle
    colors: Joi.array().items(Joi.string()).required(), // Validación adicional para los colores disponibles
    features: Joi.object({ // Objeto de características
        traction_control: Joi.boolean().required(), // Validación adicional para el control de tracción
        quick_shift: Joi.boolean().required(), // Validación adicional para el cambio rápido
        abs: Joi.boolean().required() // Validación adicional para el sistema de frenos antibloqueo
    }).required(),
    created_at: Joi.date().iso().allow(null).optional() // Permitir 'created_at' como opcional
});



//---------------- RUTAS -----------------------

app.get('/',(req,res)=>{
    res.send('Hello World')
})

app.put('/motos/update-updated-at', (req, res) => {
    console.log("Se ha recibido una solicitud PUT en la ruta /motos/update-updated-at");
    
    let Motos = leerArchivo('./db.json');

    // Obtener la fecha y hora actual
    const currentDateTime = moment().format('YYYY-MM-DD HH:mm');
    console.log("Fecha y hora actual:", currentDateTime);

    // Actualizar el campo updated_at en todos los registros
    Motos.forEach(moto => {
        // Solo actualizar si el campo updated_at está vacío
        if (!moto.updated_at) {
            moto.updated_at = currentDateTime;
        }
    });

    console.log("Datos después de la actualización:", Motos);

    // Escribir los datos actualizados en el archivo
    escribirArchivo('./db.json', Motos);

    console.log("Datos escritos en el archivo db.json.");

    res.send('Campo updated_at actualizado en todos los registros.');
    console.log('Campo updated_at actualizado en todos los registros.');
});

// Rutas INDEX

app.get('/motos', (req, res) => {
    const Motos = leerArchivo('./db.json');
    let motosFiltradas = Motos;

    // Verificar si hay un query param presente en la solicitud
    const filtro = req.query.filtro;
    const valor = req.query.valor;

    // Si hay un query param presente y un valor asociado, filtrar los registros según la clave y el valor especificados
    if (filtro && valor && Motos.length > 0) {
        motosFiltradas = Motos.filter(moto => moto[filtro] === valor);
    }

    // Crear un documento PDF
    const doc = new PDFDocument();

    // Configurar el tipo de contenido y el encabezado para la respuesta HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="motos.pdf"');
    
    // Escribir la información de las motos en el PDF
    doc.pipe(res);
    doc.fontSize(20).text('Lista de Motos\n\n');
    motosFiltradas.forEach(moto => {
        doc.fontSize(14).text(`${moto.brand}, ${moto.model}, ${moto.engine_displacement_cc}cc\n\n`);
    });

    // Finalizar el documento PDF
    doc.end();
});



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
app.post('/motos', agregarCreatedAt, (req, res) => {
    const moto = req.body

    
    // Validar los datos recibidos
    const { error } = schema.validate(moto);

    // Si hay errores de validación, devolver una respuesta de error
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    const Motos = leerArchivo('./db.json')
    moto.id = Motos.length + 1
    Motos.push(moto)
    //Escribir archivo
    escribirArchivo('./db.json',Motos)
    res.status(201).send(moto)
})

// Rutas UPDATE
app.put('/motos/:id', agregarCreatedAt, (req, res) => {
    const id = req.params.id;
    const newData = req.body;
    let Motos = leerArchivo('./db.json');

    // Buscar la moto por su ID
    const motoIndex = Motos.findIndex(moto => moto.id === parseInt(id));

    // Si no se encuentra la moto, devolver un error 404
    if (motoIndex === -1) {
        return res.status(404).send('No existe la moto');
    }

    // Validar los datos recibidos
    const { error } = schema.validate(newData);

    // Si hay errores de validación, devolver una respuesta de error
    if (error) {
        return res.status(400).send(error.details[0].message);
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
    console.log(`Moto con ID ${id} actualizada exitosamente.`);
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

