// =================================================================
// CONFIGURACIÓN AUTOMÁTICA DEL BACKEND (local o Docker)
// =================================================================

// Detecta si el frontend está en entorno local o dockerizado
let API_BASE_URL;

// Si el sitio se abre desde el host (localhost:8080 o 127.0.0.1:8080),
// el navegador debe hablar con el backend publicado en el puerto 8000.
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    API_BASE_URL = "http://localhost:8000";
    console.warn("🛠️ Modo navegador Docker: usando backend en http://localhost:8000");
} else {
    // Este caso solo aplica si TODO corre dentro de Docker (no navegador)
    API_BASE_URL = "http://app:8000";
    console.warn("🐳 Modo interno Docker: usando backend en http://app:8000");
}

console.log(`✅ API_BASE_URL final: ${API_BASE_URL}`);

// =================================================================
// ELEMENTOS DEL DOM
// =================================================================
const createForm = document.getElementById('create-history-form'); 
const searchForm = document.getElementById('search-form'); 
const createMessageEl = document.getElementById('create-message'); 
const apiStatusEl = document.getElementById('api-status');
const historiesListContainer = document.getElementById('histories-list');

// =================================================================
// UTILIDADES
// =================================================================
function displayMessage(message, isError = false) {
    const targetEl = createMessageEl || apiStatusEl;
    if (!targetEl) return;
    targetEl.textContent = message;
    targetEl.className = isError 
        ? 'text-center text-sm font-semibold text-red-600 mt-2 p-2 rounded-lg bg-red-50' 
        : 'text-center text-sm font-semibold text-green-600 mt-2 p-2 rounded-lg bg-green-50';
    setTimeout(() => {
        if (createMessageEl) {
            createMessageEl.textContent = '';
            createMessageEl.className = 'text-center text-sm mt-2';
        } else {
            checkApiStatus();
        }
    }, 5000);
}

// =================================================================
// VERIFICACIÓN DE ESTADO (GET /status)
// =================================================================
async function checkApiStatus() {
    if (!apiStatusEl) return;
    try {
        const response = await fetch(`${API_BASE_URL}/status`);
        if (response.ok) {
            const statusData = await response.json();
            const apiOk = statusData.api_status === "OK";
            const dbOk = statusData.database === "OK";
            if (apiOk && dbOk) {
                apiStatusEl.textContent = `✅ API OK | Base de datos OK`;
                apiStatusEl.className = 'mt-3 p-2 rounded-lg text-sm font-medium bg-green-100 text-green-700';
            } else if (apiOk && !dbOk) {
                apiStatusEl.textContent = `⚠️ API OK | Error DB: ${statusData.database}`;
                apiStatusEl.className = 'mt-3 p-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700';
            } else {
                apiStatusEl.textContent = `❌ Error API (${statusData.api_status})`;
                apiStatusEl.className = 'mt-3 p-2 rounded-lg text-sm font-medium bg-red-100 text-red-700';
            }
        } else {
            apiStatusEl.textContent = `❌ API no accesible (${response.status})`;
            apiStatusEl.className = 'mt-3 p-2 rounded-lg text-sm font-medium bg-red-100 text-red-700';
        }
    } catch {
        apiStatusEl.textContent = `❌ No se pudo contactar con ${API_BASE_URL}`;
        apiStatusEl.className = 'mt-3 p-2 rounded-lg text-sm font-medium bg-red-100 text-red-700';
    }
}

// =================================================================
// LÓGICA DE CREACIÓN (POST)
// =================================================================
async function createMedicalHistory(e) {
    e.preventDefault(); 
    displayMessage('Guardando historial...', false); 
    const emailInput = document.getElementById('new_patient_email');
    const data = {
        patient_email: emailInput.value,
        doctor_id: document.getElementById('new_doctor_id').value,
        diagnosis: document.getElementById('new_diagnosis').value,
        treatment: document.getElementById('new_treatment').value || null, 
        notes: document.getElementById('new_notes').value || null, 
    };
    try {
        const response = await fetch(`${API_BASE_URL}/histories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (response.ok) {
            const newHistory = await response.json();
            displayMessage(`✅ Historial creado para ${newHistory.patient_email}`, false);
            createForm.reset();
            document.getElementById('search_patient_email').value = newHistory.patient_email;
            await searchHistories(new CustomEvent('manual-search')); 
        } else {
            const errorData = await response.json().catch(() => ({}));
            displayMessage(`❌ Error API (${response.status}): ${errorData.detail || response.statusText}`, true);
        }
    } catch (error) {
        console.error('Error de red:', error); 
        displayMessage('❌ Error de conexión. Verifica Docker o CORS.', true);
    }
    checkApiStatus(); 
}

// =================================================================
// LÓGICA DE ELIMINACIÓN (DELETE)
// =================================================================
async function deleteMedicalHistory(historyId, patientEmail) {
    if (!confirm(`¿Eliminar historial ${historyId.slice(-6)}?`)) return;
    displayMessage('Eliminando historial...', false); 
    try {
        const response = await fetch(`${API_BASE_URL}/histories/${historyId}`, { method: 'DELETE' });
        if (response.status === 204) {
            displayMessage(`✅ Historial eliminado.`, false);
            document.getElementById('search_patient_email').value = patientEmail;
            await searchHistories(new CustomEvent('manual-search')); 
        } else {
            const errorData = await response.json().catch(() => ({}));
            displayMessage(`❌ Error (${response.status}): ${errorData.detail || response.statusText}`, true);
        }
    } catch {
        displayMessage('❌ Error de conexión al eliminar.', true);
    }
    checkApiStatus();
}

// =================================================================
// LÓGICA DE BÚSQUEDA (GET)
// =================================================================
async function searchHistories(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = document.getElementById('search_patient_email').value; 
    historiesListContainer.innerHTML = `<p class="text-blue-500 text-center py-4">Buscando historiales para <b>${email}</b>...</p>`;

    try {
        const response = await fetch(`${API_BASE_URL}/histories/patient/${encodeURIComponent(email)}`);
        console.log("📡 Petición GET enviada a:", `${API_BASE_URL}/histories/patient/${encodeURIComponent(email)}`);

        if (!response.ok) {
            historiesListContainer.innerHTML = `<p class="text-red-600 text-center py-4">Error API: ${response.status} ${response.statusText}</p>`;
            return;
        }

        const data = await response.json();
        console.log("📦 Datos recibidos del backend:", data);

        // Asegura que siempre sea un array
        const list = Array.isArray(data) ? data : (data.data || data.histories || []);

        // Limpia mensajes previos
historiesListContainer.innerHTML = '';

// Oculta el mensaje inicial si existe
const initialMsg = document.getElementById('initial-message');
if (initialMsg) initialMsg.style.display = 'none';

if (!list || list.length === 0) {
    historiesListContainer.innerHTML = `<p class="text-gray-500 text-center py-4">No se encontraron historiales.</p>`;
    return;
}

// Renderiza los historiales
console.log(`✅ ${list.length} historiales encontrados.`);
list.forEach(h => {
    const card = renderHistoryCard(h);
    historiesListContainer.appendChild(card);
});


    } catch (error) {
        console.error("❌ Error de conexión:", error);
        historiesListContainer.innerHTML = `<p class="text-red-600 text-center py-4">❌ Error de conexión con ${API_BASE_URL}</p>`;
    }
}

// =================================================================
// RENDERIZADO DE TARJETAS
// =================================================================
function renderHistoryCard(record) {
    const id = record._id || record.id || crypto.randomUUID().slice(-6);
    const date = record.created_at
        ? new Date(record.created_at).toLocaleString('es-MX', { 
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        })
        : 'Fecha desconocida';

    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-xl shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition duration-300 mb-3';
    card.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <p class="text-xs font-bold text-gray-700">🩺 ID: ${id.slice(-6)} | ${date}</p>
            <span class="text-xs font-semibold text-indigo-600">Dr. ${record.doctor_id || 'N/A'}</span>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-1">${record.diagnosis || 'Sin diagnóstico'}</h3>
        <div class="space-y-1 text-sm text-gray-700 mt-2 pt-2 border-t border-gray-200">
            <p><strong>Tratamiento:</strong> ${record.treatment || 'No especificado'}</p>
            <p><strong>Notas:</strong> ${record.notes || 'Sin notas adicionales'}</p>
        </div>
        <div class="mt-4 flex justify-end">
            <button class="delete-btn bg-red-500 text-white px-3 py-1 text-sm rounded-lg hover:bg-red-600 transition duration-150" 
                    data-id="${id}" data-email="${record.patient_email}">Eliminar</button>
        </div>
    `;

    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteMedicalHistory(id, record.patient_email));
    return card;
}


// =================================================================
// EVENTOS
// =================================================================
window.addEventListener('load', () => {
    checkApiStatus();
    setInterval(checkApiStatus, 10000);
});
if (createForm) createForm.addEventListener('submit', createMedicalHistory);
if (searchForm) searchForm.addEventListener('submit', searchHistories);
