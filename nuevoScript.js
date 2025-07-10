// === DECLARACIÓN DE LAS APIs ===
const API_KEY = 'f9b1a141378864e8ccd44b63053a1ba8';
const STRAPI_URL = 'https://gestionweb.frlp.utn.edu.ar/api/g33-series';
let jwtToken = '099da4cc6cbb36bf7af8de6f1f241f8c81e49fce15709c4cfcae1313090fa2c1ac8703b0179863b4eb2739ea65ae435e90999adb870d49f9f94dcadd88999763119edca01a6b34c25be92a80ed30db1bcacb20df40e4e7f45542bd501f059201ad578c18a11e4f5cd592cb25d6c31a054409caa99f11b6d2391440e9c72611ea';


document.addEventListener("DOMContentLoaded", function () {
    let botonCargar = document.getElementById("boton-cargar-datos");
    let botonVisualizar = document.getElementById("boton-visualizar-datos");
    let botonLimpiar = document.getElementById("boton-limpiar-pantalla");

    botonCargar.addEventListener("click", function (event) {
        estado_display = limpiarPantalla(2);
        botonLimpiar.style.display = estado_display;
        cargarDatos();
    });

    botonVisualizar.addEventListener("click", function () {
        estado_display = limpiarPantalla(2);
        botonLimpiar.style.display = estado_display;
        visualizarDatos();
    });

    botonLimpiar.addEventListener("click", function () {
        estado_display = limpiarPantalla(1);
        // Limpio y hago desaparecer el botón
        botonLimpiar.style.display = estado_display;
    });

});


// === FUNCIONES PRINCIPALES ===

// EN REALIDAD ESTAMOS HACIENDO CARGAR DATOS, HAY QUE CAMBIARLE EL NOMBRE!!!
// Visualizar datos
async function cargarDatos() {

    try {
        // 1. Proceso las series
        let series = await procesarSeries()

        // 2. Muestro las series en pantalla
        mostrarSeries(series) // No le pongo await porque no consumo una api (no retorna promise)

        // flag
        console.log("Las series más populares PROCESADAS son: ", series)

        // 3. Lo guardo en el strapi
        await guardarEnStrapi(series);
    } catch (error) {
        console.error('ERROR! (cargarDatos):', error);
    }

};

// Limpiar pantalla
function limpiarPantalla(op) {

    // Opción 1: limpieza del contenedor imprimiendo texto y validación
    if (op == 1) {
        if (confirm('¿Borrar todos los datos mostrados?')) {
            document.getElementById('series-container').innerHTML =
                '<p class="no-data">Datos limpiados. Use "Visualizar datos" para recuperar.</p>';
            return "none"
        }
        // Mantiene el botón visible porque el usuario apretó cancelar
        return "block"
    }

    // Opción 2: limpieza del contenedor sin nada más
    if (op == 2) {
        const contenedor = document.getElementById("series-container");

        // Cuando no hay ningún hijo (firstChild es null → falsy)
        // falsy es cualquier valor que, cuando se evalúa en una estructura de control se comporta como false
        while (contenedor.firstChild) {
            contenedor.removeChild(contenedor.firstChild);
        }
        // Cambia el estado del display a block
        return "block"
    }
}

// === FUNCIONES SECUNDARIAS ===

// Proceso los datos de las series
async function procesarSeries() {

    // === CONSUMIR LA API ===

    try {
        // Recupero todas las películas más populares y selecciono las primeras 5
        let series = await fetch(`https://api.themoviedb.org/3/tv/popular?limit=5&api_key=${API_KEY}`)
            .then(respuesta => respuesta.json())
            // Tengo que seleccionar así porque pero porque la API de TMDb no reconoce el parámetro limit
            .then(seriesData => seriesData.results.slice(0, 5))
        // Recupero todos los generos
        let generos = await fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${API_KEY}`)
            .then(respuesta => respuesta.json())
            .catch(error => console.log("ERROR! (generos): ", error))
        // flag
        console.log("Las series más populares SIN PROCESAR son: ", series)
        // flag
        console.log("Los generos son: ", generos)
        // new Map(...) convierte ese array de pares en un objeto Map que es un diccionario básicamente
        // .map(g => [g.id, g.name]) convierte cada objeto en un par [clave, valor], ejemplo: [[18, "Drama"], [35, "Comedia"], ...]
        generos = new Map(generos.genres.map(g => [g.id, g.name]));
        // series.map(...) está transformando cada objeto con esa estructura
        series = series.map(serie => ({
            titulo: serie.name,
            // Acá se transforman los id de género en sus nombres usando el Map, si no lo encuentra le asigna "Desconocido"
            generos: (serie.genre_ids.map(id => generos.get(id) || 'Desconocido')).join(", "),
            imagen: `https://image.tmdb.org/t/p/w200${serie.poster_path}`,
            popularidad: serie.popularity
        }));
        return series
    } catch (error) {
        console.error('ERROR! (procesarDatos):', error);
    }
}

// imprimir las series en pantalla
function mostrarSeries(series) {
    // Flag
    series.forEach(serie => console.log(serie))

    let contenedor = document.getElementById("series-container")

    let i = 0
    series.forEach((serie, i) => {
        tarjeta = generarTarjeta(series[i])
        console.log(tarjeta)
        contenedor.appendChild(tarjeta)
        i++
    })

}

// generar las tarjetas para imprimirlas
function generarTarjeta(serie) {
    // Creamos las estructuras
    let tarjeta = document.createElement("div")
    let titulo = document.createElement("h3")
    let generos = document.createElement("span")
    let popularidad = document.createElement("span")
    let imagen = document.createElement("img")

    // Le damos valores
    titulo.textContent = serie.titulo
    // Usamos el método de arrays .join() pque convierte todos sus elementos en una sola cadena de texto
    // TODO se le puede poner una clase al stron Generos para ponerle otra letra o algo
    generos.innerHTML = `<p><strong>Generos:</strong> ${serie.generos}<p>`
    popularidad.innerHTML = `<p><strong>Popularidad:</strong> ${serie.popularidad}<p>`
    imagen.src = serie.imagen
    imagen.alt = serie.titulo

    // Encolo los elementos a la tarjeta
    tarjeta.appendChild(titulo)
    tarjeta.appendChild(generos)
    tarjeta.appendChild(popularidad)
    tarjeta.appendChild(imagen)
    tarjeta.className = "serie"

    return tarjeta
}

// Guardar en el strapi 
// TODO (falta depurar porque literalmente copié y pegué)
// TODO Falta saber si en verdad guarda algo en el strapi
async function guardarEnStrapi(series) {
    console.log("ESTOY EN GUARDAR")

    /*
    const nuevaSerie = {
        titulo: series[0].titulo,
        generos: series[0].generos.join(", "),
        imagen: series[0].imagen,
        popularidad: toString(series[0].popularidad)
        console.log("Enviando a Strapi:", nuevaSerie);
    };
    */

    try {
        const response = await axios.post(STRAPI_URL, {
            data: series[2]
        }, {
            headers: {
                'Content-Type': 'application/json',
                ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
            }
        });

        console.log('Serie guardada:', response.data);
    } catch (error) {
        console.error('Error al guardar en Strapi:', error.response?.data || error.message);
    }
}




/*

const STRAPI_URL = 'https://gestionweb.frlp.utn.edu.ar/api/g33-series';
const TOKEN = '099da4cc6cbb36bf7af8de6f1f241f8c81e49fce15709c4cfcae1313090fa2c1ac8703b0179863b4eb2739ea65ae435e90999adb870d49f9f94dcadd88999763119edca01a6b34c25be92a80ed30db1bcacb20df40e4e7f45542bd501f059201ad578c18a11e4f5cd592cb25d6c31a054409caa99f11b6d2391440e9c72611ea'; 

fetch(STRAPI_URL, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
    },
})
.then(response => {
    if (!response.ok) {
        throw new Error('Error en la solicitud: ' + response.status);
    }
    return response.json();
})
.then(data => {
    console.log('Datos recibidos:', data);
})
.catch(error => {
    console.error('Error al hacer la solicitud:', error.message);
});
*/


