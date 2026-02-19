const video = document.getElementById('webcam');
const boton = document.getElementById('btn-descubrir');

// Función para encender la cámara frontal
async function iniciarCamara() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" } // Fuerzo el uso de la cámara frontal
        });
        video.srcObject = stream;
    } catch (error) {
        console.error("Error al acceder a la cámara: ", error);
        alert("¡Ups! Necesitas dar permiso a la cámara para que el filtro funcione.");
    }
}

// Iniciar la cámara en cuanto cargue la página
iniciarCamara();

// Lo que pasará cuando toquemos el botón (por ahora un mensaje)
boton.addEventListener('click', () => {
    alert("¡Próximo paso: Aquí programaremos la ruleta y los gráficos de MediaPipe!");
});
