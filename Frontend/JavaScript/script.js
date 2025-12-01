// =================================================================
// 1. CONFIGURACIÓN DE LA URL
// =================================================================
// El navegador siempre se conecta a localhost (tu PC), no a "app" (interno de Docker)
let API_BASE_URL = "http://localhost:8000";

// Si abres la web desde otra PC en tu red, ajusta la IP automáticamente
if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    API_BASE_URL = `http://${window.location.hostname}:8000`;
}

console.log(`✅ Conectando al Backend en: ${API_BASE_URL}`);

// Referencias al DOM (HTML)
const createForm = document.getElementById('create-history-form'); 
const searchForm = document.getElementById('search-form'); 
const apiStatusEl = document.getElementById('api-status');
const historiesListContainer = document.getElementById('histories-list');
const notificationContainer = document.getElementById('notification-container');

// =================================================================
// 2. SISTEMA DE NOTIFICACIONES (Mensajes flotantes)
// =================================================================
function mostrarNotificacion(mensaje, tipo = 'success') {
    if (!notificationContainer) return;

    const notif = document.createElement('div');
    const colorClass = tipo === 'success' ? 'bg-green-600' : 'bg-red-600';
    
    // Clases de Tailwind para la animación y estilo
    notif.className = `${colorClass} text-white px-6 py-4 rounded-lg shadow-2xl mb-3 flex items-center gap-3 transform transition-all duration-500 translate-y-10 opacity-0`;
    notif.innerHTML = `
        <span class="text-xl">${tipo === 'success' ? '✅' : '⚠️'}</span>
        <p class="font-medium">${mensaje}</p>
    `;
    
    notificationContainer.appendChild(notif);

    // Animación de entrada
    setTimeout(() => notif.classList.remove('translate-y-10', 'opacity-0'), 10);

    // Desaparecer automáticamente
    setTimeout(() => {
        notif.classList.add('opacity-0', 'translate-y-10');
        setTimeout(() => notif.remove(), 500);
    }, 4000);
}

// =================================================================
// 3. VERIFICAR ESTADO (Health Check)
// =================================================================
async function verificarEstadoAPI() {
    if (!apiStatusEl) return;
    
    try {
        // Intenta conectar al endpoint /status (si lo creaste) o /docs (fallback)
        let response = await fetch(`${API_BASE_URL}/status`).catch(() => null);
        
        // Si /status no existe, probamos con la raíz para ver si al menos responde
        if (!response || !response.ok) {
            response = await fetch(`${API_BASE_URL}/docs`, { method: 'HEAD' });
        }

        if (response && response.ok) {
            apiStatusEl.innerHTML = `🟢 <b>Sistema En Línea</b>`;
            apiStatusEl.className = 'mt-3 p-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 border border-green-400 text-center';
        } else {
            throw new Error("API responde con error");
        }
    } catch (error) {
        console.error("Estado API:", error);
        apiStatusEl.innerHTML = `🔴 <b>Desconectado</b> <span class="text-xs block">Revisa que Docker esté corriendo</span>`;
        apiStatusEl.className = 'mt-3 p-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 border border-red-400 text-center';
    }
}

// =================================================================
// 4. CREAR HISTORIAL (POST)
// =================================================================
async function crearHistorial(e) {
    e.preventDefault(); 
    
    // Datos del formulario
    const emailInput = document.getElementById('new_patient_email');
    const data = {
        patient_email: emailInput.value,
        doctor_id: document.getElementById('new_doctor_id').value,
        diagnosis: document.getElementById('new_diagnosis').value,
        treatment: document.getElementById('new_treatment').value || null, 
        notes: document.getElementById('new_notes').value || null, 
    };

    try {
        const response = await fetch(`${API_BASE_URL}/histories/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const nuevoRegistro = await response.json();
            mostrarNotificacion(`Historial guardado para ${nuevoRegistro.patient_email}`, 'success');
            createForm.reset();
            
            // Auto-buscar para ver el registro creado inmediatamente
            document.getElementById('search_patient_email').value = nuevoRegistro.patient_email;
            buscarHistoriales(new CustomEvent('busqueda-manual')); 
        } else {
            const errorData = await response.json().catch(() => ({}));
            mostrarNotificacion(`Error: ${errorData.detail || 'No se pudo guardar'}`, 'error');
        }
    } catch (error) {
        console.error(error);
        mostrarNotificacion('Error de conexión con el servidor', 'error');
    }
}

// =================================================================
// 5. BUSCAR HISTORIALES (GET)
// =================================================================
async function buscarHistoriales(e) {
    if (e && e.preventDefault) e.preventDefault();
    
    const email = document.getElementById('search_patient_email').value; 
    
    // Spinner de carga
    historiesListContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-indigo-600">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-current mb-2"></div>
            <p>Buscando...</p>
        </div>`;

    try {
        const response = await fetch(`${API_BASE_URL}/histories/patient/${encodeURIComponent(email)}`);
        
        if (!response.ok) throw new Error("Error en la petición");

        const data = await response.json();
        // Aseguramos que sea un array (por si el backend devuelve un objeto envuelto)
        const lista = Array.isArray(data) ? data : (data.data || []);

        historiesListContainer.innerHTML = '';
        
        // Ocultar mensaje inicial
        const initialMsg = document.getElementById('initial-message');
        if (initialMsg) initialMsg.style.display = 'none';

        if (lista.length === 0) {
            historiesListContainer.innerHTML = `
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-yellow-700">
                    <p>No se encontraron historiales para <b>${email}</b>.</p>
                </div>`;
            return;
        }

        // Renderizar cada tarjeta
        lista.forEach(item => {
            const card = renderizarTarjeta(item);
            historiesListContainer.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        historiesListContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-center">
                ❌ No se pudo obtener la información. Revisa la consola.
            </div>`;
    }
}

// =================================================================
// 6. ELIMINAR HISTORIAL (DELETE)
// =================================================================
async function eliminarHistorial(id, emailPaciente) {
    if (!confirm("¿Estás seguro de eliminar este historial permanentemente?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/histories/${id}`, { method: 'DELETE' });
        
        if (response.ok || response.status === 204) {
            mostrarNotificacion("Historial eliminado correctamente", 'success');
            // Recargar la lista
            document.getElementById('search_patient_email').value = emailPaciente;
            buscarHistoriales(new CustomEvent('recarga')); 
        } else {
            mostrarNotificacion("No se pudo eliminar el registro", 'error');
        }
    } catch (error) {
        mostrarNotificacion("Error de conexión", 'error');
    }
}

// =================================================================
// 7. RENDERIZAR TARJETA (HTML Dinámico)
// =================================================================
function renderizarTarjeta(registro) {
    // MongoDB usa _id, pero tu modelo Pydantic podría devolver 'id'. Manejamos ambos.
    const id = registro.id || registro._id; 
    
    // Formatear fecha
    const fecha = registro.created_at
        ? new Date(registro.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
        : 'Fecha desconocida';

    const card = document.createElement('div');
    card.className = 'bg-white p-5 rounded-xl shadow-md border-l-4 border-indigo-500 hover:shadow-lg transition duration-300 relative';
    
    card.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <div>
                <h3 class="text-xl font-bold text-gray-800">${registro.diagnosis}</h3>
                <p class="text-xs text-gray-500 uppercase tracking-wide mt-1">📅 ${fecha}</p>
            </div>
            <span class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-full">
                Dr. ${registro.doctor_id}
            </span>
        </div>
        
        <div class="space-y-2 text-sm text-gray-700">
            ${registro.treatment ? `
                <div class="flex gap-2">
                    <span class="font-semibold min-w-[80px]">Tratamiento:</span>
                    <span>${registro.treatment}</span>
                </div>` : ''}
            
            ${registro.notes ? `
                <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 italic text-gray-600 mt-2">
                    📝 "${registro.notes}"
                </div>` : ''}
        </div>

        <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <span class="text-xs text-gray-400 font-mono">ID: ...${id.slice(-6)}</span>
            <button class="btn-eliminar bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                🗑️ Eliminar
            </button>
        </div>
    `;

    // Asignar evento al botón dentro de la tarjeta
    card.querySelector('.btn-eliminar').addEventListener('click', () => {
        eliminarHistorial(id, registro.patient_email);
    });

    return card;
}

// =================================================================
// INICIALIZACIÓN
// =================================================================
window.addEventListener('load', () => {
    verificarEstadoAPI();
    // Verificar conexión cada 15 segundos
    setInterval(verificarEstadoAPI, 15000);
});

// Listeners de formularios
if (createForm) createForm.addEventListener('submit', crearHistorial);
if (searchForm) searchForm.addEventListener('submit', buscarHistoriales);