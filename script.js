// Configuración
const API_KEY = 'f9b1a141378864e8ccd44b63053a1ba8';
const STRAPI_URL = 'https://gestionweb.frlp.utn.edu.ar/api/g33-series';
let jwtToken = '';

// Función principal para cargar datos
async function cargarDatos() {
  try {
    // Consumir la API
    const [seriesData, genresData] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`).then(r => r.json()),
      fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${API_KEY}`).then(r => r.json())
    ]);

    const top5Series = seriesData.results.slice(0, 5);
    const generosMap = new Map(genresData.genres.map(g => [g.id, g.name]));

    console.log(top5Series);
    console.log(generosMap);

    const seriesProcesadas = top5Series.map(serie => ({
      titulo: serie.name,
      generos: serie.genre_ids.map(id => generosMap.get(id) || 'Desconocido').join(', '),
      poster: `https://image.tmdb.org/t/p/w200${serie.poster_path}`,
      rating: serie.vote_average,
      fecha: new Date(serie.first_air_date).getFullYear()
    }));

    mostrarSeries(seriesProcesadas);

    try {
      await guardarEnStrapi(seriesProcesadas);
      actualizarEstadisticas('Datos guardados en Strapi correctamente');
    } catch (error) {
      console.warn('Error con Strapi, usando localStorage:', error);
      guardarEnLocal(seriesProcesadas);
      actualizarEstadisticas('Datos guardados localmente');
    }
  } catch (error) {
    console.error('Error:', error);
    actualizarEstadisticas(`Error: ${error.message}`);
  }
}

// 2. Función para visualizar datos
async function verDatos() {
  try {
    let series = [];

    // Intentar cargar desde Strapi
    const response = await fetch(STRAPI_URL, {
      headers: jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}
    });

    if (response.ok) {
      const data = await response.json();
      series = data.data.map(item => ({
        titulo: item.attributes.titulo,
        generos: item.attributes.generos,
        poster: item.attributes.poster_url,
        rating: item.attributes.rating,
        fecha: item.attributes.fecha
      }));
      actualizarEstadisticas('Datos cargados desde Strapi');
    } else {
      // Fallback a localStorage
      series = cargarDesdeLocal();
      actualizarEstadisticas('Datos cargados desde backup local');
    }

    if (series.length > 0) {
      mostrarSeries(series);
    } else {
      document.getElementById('series-container').innerHTML =
        '<p class="no-data">No hay datos almacenados. Use "Cargar datos" primero.</p>';
    }
  } catch (error) {
    console.error('Error:', error);
    actualizarEstadisticas(`Error al cargar: ${error.message}`);
  }
}

// 3. Función para guardar en Strapi
async function guardarEnStrapi(series) {
  for (const serie of series) {
    const response = await fetch(STRAPI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` })
      },
      body: JSON.stringify({
        data: {
          titulo: serie.titulo,
          generos: serie.generos,
          poster_url: serie.poster,
          rating: serie.rating,
          fecha: serie.fecha
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }
  }
}

// 4. Funciones de almacenamiento local
function guardarEnLocal(series) {
  localStorage.setItem('seriesLocales', JSON.stringify(series));
}

function cargarDesdeLocal() {
  const datos = localStorage.getItem('seriesLocales');
  return datos ? JSON.parse(datos) : [];
}

// 5. Función para mostrar series
function mostrarSeries(series) {
  const container = document.getElementById('series-container');

  if (!series || series.length === 0) {
    container.innerHTML = '<p class="no-data">No hay datos para mostrar</p>';
    return;
  }

  container.innerHTML = series.map(serie => `
    <div class="serie">
      <img src="${serie.poster}" alt="${serie.titulo}" 
           onerror="this.src='https://via.placeholder.com/120x180?text=Poster+no+disponible'">
      <div class="serie-info">
        <h3>${serie.titulo} (${serie.fecha || 'N/A'})</h3>
        <p><strong>Géneros:</strong> ${serie.generos}</p>
        <p><strong>Rating:</strong> ${serie.rating?.toFixed(1) || 'N/A'}/10</p>
      </div>
    </div>
  `).join('');
}

// 6. Función para estadísticas
function actualizarEstadisticas(mensaje) {
  const statsContainer = document.getElementById('stats-container');
  statsContainer.innerHTML = `
    <div class="stat-item">
      <h3>Última acción:</h3>
      <p>${new Date().toLocaleString()}</p>
      <p>${mensaje}</p>
    </div>
  `;
}

// 7. Función para limpiar
function limpiarDatos() {
  if (confirm('¿Borrar todos los datos mostrados?')) {
    document.getElementById('series-container').innerHTML =
      '<p class="no-data">Datos limpiados. Use "Visualizar datos" para recuperar.</p>';
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  const series = cargarDesdeLocal();
  if (series.length > 0) {
    actualizarEstadisticas('Datos locales disponibles');
  }
});