
const API = 'http://localhost:5000/api/progreso';

const form = document.getElementById('progresoForm');
const historialUL = document.getElementById('historial');
const cargarHistorialBtn = document.getElementById('cargarHistorialBtn');


form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    id_usuario: document.getElementById('id_usuario').value, 
    peso: parseFloat(document.getElementById('peso').value),
    circunferencia_cintura: parseFloat(document.getElementById('cintura').value),
    comentarios_usuario: document.getElementById('comentarios').value
  };

  const id_registrado = data.id_usuario; 

  // Se realiza la validación mínima
  if (!id_registrado || isNaN(data.peso)) {
      alert('El ID de usuario y el peso son obligatorios.');
      return;
  }

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    
    if (res.ok) {
        alert('Progreso registrado con ID: ' + result.id_progreso);
        form.reset();
        
        document.getElementById('id_usuario_historial').value = id_registrado; 

        cargarHistorial(); 
    } else {
        alert('Error al registrar: ' + (result.error || 'Respuesta de servidor no exitosa.'));
    }

  } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión al registrar el progreso. Asegúrate de que Docker esté corriendo.');
  }
});



cargarHistorialBtn.addEventListener('click', cargarHistorial);

async function cargarHistorial() {
  const id = document.getElementById('id_usuario_historial').value;
  if (!id) {
    alert('Ingresa tu ID de usuario para ver el historial.');
    return;
  }

  // Obtener fechas para filtrado
  const fechaInicioStr = document.getElementById('fecha_inicio').value;
  const fechaFinStr = document.getElementById('fecha_fin').value;

  try {
    const res = await fetch(`${API}/${id}`);
    
    if (!res.ok) {
        const error = await res.json();
        alert('Error al cargar historial: ' + (error.error || 'Respuesta no exitosa del servidor.'));
        return;
    }
    
    const datos = await res.json();

    historialUL.innerHTML = ''; 
    const historialFiltrado = datos.filter(item => {
        const fechaRegistro = item.fecha_registro.split(' ')[0]; 

        let pasaFiltro = true;

        if (fechaInicioStr && fechaRegistro < fechaInicioStr) {
            pasaFiltro = false;
        }

        if (fechaFinStr && pasaFiltro && fechaRegistro > fechaFinStr) {
            pasaFiltro = false;
        }
        
        return pasaFiltro;
    });
    
    // MOSTRAR RESULTADOS
    if (historialFiltrado.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No se encontraron registros en el rango de fechas o para este ID.';
        historialUL.appendChild(li);
        return;
    }

    historialFiltrado.forEach(item => {
      const li = document.createElement('li');
      const cintura_display = item.circunferencia_cintura || '-';
      const comentarios_display = item.comentarios_usuario || 'N/A';
      li.textContent = `[${item.fecha_registro.split(' ')[0]}] - Peso: ${item.peso} kg, Cintura: ${cintura_display} cm. Comentarios: ${comentarios_display}`;
      historialUL.appendChild(li);
    });

  } catch (error) {
      console.error(error);
      alert('Error de conexión o datos al cargar el historial.');
  }d
}