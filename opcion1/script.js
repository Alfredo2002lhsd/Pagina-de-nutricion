async function enviarMensaje() {
    const input = document.getElementById('mensaje');
    const texto = input.value.trim();
    if (!texto) return;

    mostrarMensaje("Tú", texto, "usuario");
    input.value = "";

    try {
      console.log("Enviando mensaje a la API:", texto); // Debug

      const res = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: texto })
      });

      const data = await res.json();
      console.log("Respuesta recibida:", data); // Debug
      mostrarMensaje("Llama", data.respuesta, "ia");

    } catch (error) {
      console.error("Error al conectar:", error); // Debug
      mostrarMensaje("Error", "No se pudo conectar al servidor", "error");
    }
  }

  function mostrarMensaje(nombre, texto, clase) {
    const contenedor = document.getElementById('mensajes');
    const div = document.createElement('div');
    div.classList.add('mensaje');
    div.innerHTML = `<span class="${clase}">${nombre}:</span> ${texto}`;
    contenedor.appendChild(div);
    contenedor.scrollTop = contenedor.scrollHeight;
  }



  document.addEventListener("DOMContentLoaded", function () {
    const carousel = document.getElementById('carousel');
    const infoBox = document.getElementById('infoBox');
    const ingredientsBox = document.getElementById('ingredientsBox');
    const preparacionBox = document.getElementById('preparacionBox');
    const images = carousel.querySelectorAll('img');
    let currentIndex = 0;
  
    const ingredientes = {
      0: ['2 huevos', '1 taza de espinaca', '1 cdita aceite', 'Sal y pimienta'],
      1: ['1 taza garbanzos cocidos', '1 tomate', '¼ cebolla morada', '¼ taza pepino', 'Jugo de 1 limón', 'Sal, pimienta, orégano'],
      2: ['1 lata de atún en agua', '½ aguacate', '1 cda limón', '1 cdita aceite de oliva', 'Sal y pimienta'],
      3: ['1 taza lentejas cocidas', '1 huevo', '2 cdas pan molido', '1 ajo picado', 'Sal, pimienta y comino'],
      4: ['1 pechuga pollo en cubos', '½ zanahoria', '½ calabacita', '¼ cebolla', '1 cdita aceite', 'Sal, pimienta, ajo en polvo'],
      5: ['2 nopales', '50g queso panela', '2 tortillas', 'Sal al gusto']
    };

    const preparacion = {
      0: ['Lava bien la espinaca y escúrrela.', 'En una sartén, calienta el aceite a fuego medio.' ,'Añade la espinaca y saltea por 1 minuto.',
          'Bate los huevos con una pizca de sal y pimienta.', 'Vierte los huevos sobre la espinaca y revuelve suavemente hasta que se cocinen (2-3 min).'],
      1: ['Lava y corta todas las verduras.','En un bowl, mezcla los garbanzos, tomate, cebolla y pepino.',
        'Añade el jugo de limón, sal, pimienta y un poco de orégano.','Mezcla bien y refrigera 15 minutos si quieres que esté más fresca'],
      2: ['En un plato, machaca el aguacate','Añade el atún, el jugo de limón, el aceite, sal y pimienta','Mezcla todo hasta que quede bien combinado',
        'Puedes servirlo en tostadas, tortillas, o con galletas saladas','Opcional: agrega jitomate picado o chile si te gusta con más sabor'],
      3: ['Tritura un poco las lentejas cocidas con un tenedor', 'Mezcla con el huevo, pan molido, ajo y especias', 'Forma pequeñas tortitas con la mezcla',
         'En una sartén con un poco de aceite, fríelas por ambos lados hasta que estén doradas', 'Puedes acompañarlas con arroz, ensalada o tortillas'],
      4: ['En una sartén, calienta el aceite', 'Agrega el pollo con sal, pimienta y ajo en polvo. Cocina hasta que esté bien cocido', 
        'Añade las verduras y saltea por 3-5 minutos hasta que estén suaves pero crujientes', 'Sirve caliente. Puedes acompañar con arroz o tortillas'],
      5: ['Cuece los nopales en agua con sal hasta que cambien de color y se elimine la baba (~10 min)', 'Escurre bien', 'Prepara los tacos a tu gusto']
    };
  
    function moveCarousel(direction) {
      const itemWidth = images[0].offsetWidth + 20;
      const maxIndex = images.length - 3;
  
      currentIndex += direction;
      if (currentIndex < 0) currentIndex = maxIndex;
      if (currentIndex > maxIndex) currentIndex = 0;
  
      const offset = -currentIndex * itemWidth;
      carousel.style.transform = `translateX(${offset}px)`;
      carousel.style.transform = `translateX(${offset}px)`;

  mostrarPlatillo(currentIndex); // 👈 Mostrar información del nuevo platillo
    }
  
    window.moveCarousel = moveCarousel;
  
    images.forEach((img, index) => {
      img.addEventListener('click', () => {
        const info = img.getAttribute('data-info');
        infoBox.textContent = info;
        infoBox.style.display = 'block';
  
        // Mostrar ingredientes correspondientes
        const lista = ingredientes[index];
        if (lista) {
          ingredientsBox.innerHTML = `
            <div class="card">
              <h3>Ingredientes</h3>
              <ul>
                ${lista.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          `;
        }
              // Mostrar preparación correspondiente
          const pasos = preparacion[index];
              if (pasos) {
                preparacionBox.innerHTML = `
                <div class="card">
                <h3>Preparación</h3>
                <ul>
                ${pasos.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
          `;

        }

      });
    });

    // Obtener elementos del DOM
const contactLink = document.getElementById('contactLink');
const contactModal = document.getElementById('contactModal');
const modalOverlay = document.getElementById('modalOverlay');

// Función para abrir el modal
function openModal(e) {
    e.preventDefault(); // Prevenir el comportamiento por defecto del enlace
    contactModal.style.display = 'block';
    modalOverlay.style.display = 'block';
}

// Función para cerrar el modal
function closeModal() {
    contactModal.style.display = 'none';
    modalOverlay.style.display = 'none';
}

// Evento click en el enlace de contacto
contactLink.addEventListener('click', openModal);

// Evento click en el overlay para cerrar el modal
modalOverlay.addEventListener('click', closeModal);

// Cerrar el modal si se hace clic fuera de él
window.addEventListener('click', function(event) {
    if (event.target === modalOverlay) {
        closeModal();
    }
});
  });


document.addEventListener("DOMContentLoaded", async function () {
  // --- 1️⃣ Capturar code de la URL ---
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) {
    console.log("No se encontró código en la URL. Redirigiendo al login...");
    // opcional: redirigir a login si no hay code
    // window.location.href = "http://localhost:3000/login.html";
    return;
  }

  try {
    // --- 2️⃣ Intercambiar code por JWT ---
    const res = await fetch("http://localhost:8080/auth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) throw new Error("Código inválido o expirado");

    const data = await res.json();
    if (!data.token) throw new Error("No se recibió token del backend");

    // --- 3️⃣ Guardar JWT en localStorage ---
    localStorage.setItem("token", data.token);
    console.log("Token recibido:", data.token);

    // --- 4️⃣ Limpiar la URL ---
    const url = new URL(window.location);
    url.searchParams.delete("code");
    window.history.replaceState({}, document.title, url);

    // --- 5️⃣ Redirigir a la página protegida ---
    window.location.href = "/opcion1/index.html";

  } catch (err) {
    console.error("Error intercambiando código:", err);
    alert("Error de autenticación. Por favor inicia sesión de nuevo.");
    // opcional: redirigir a login
    // window.location.href = "http://localhost:3000/login.html";
  }
});





 