const video = document.getElementById('webcam');
const boton = document.getElementById('btn-descubrir');
const ruleta = document.getElementById('ruleta');

// Nuestra lista de animales. ¡Puedes agregar o quitar los que quieras!
const therians = ["🐺 Lobo", "🐱 Gato", "🦊 Zorro", "🐶 Perro", "🦅 Águila", "🦌 Ciervo", "🐾 Lince", "🐻 Oso"];

// Iniciar cámara frontal
async function iniciarCamara() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
    } catch (error) {
        console.error("Error de cámara: ", error);
        alert("Necesitas dar permiso a la cámara.");
    }
}
iniciarCamara();

// La magia de la Ruleta
boton.addEventListener('click', () => {
    boton.disabled = true; // Apagamos el botón para que no lo toquen mientras gira
    ruleta.style.display = "block"; // Mostramos el cuadro de texto
    
    let tiempoGiro = 0;
    
    // Este intervalo hace que el texto cambie cada 100 milisegundos
    const intervalo = setInterval(() => {
        const animalAleatorio = therians[Math.floor(Math.random() * therians.length)];
        ruleta.innerText = animalAleatorio;
        tiempoGiro += 100;

        // Cuando pasen 3 segundos (3000 milisegundos), detenemos la ruleta
        if (tiempoGiro >= 3000) {
            clearInterval(intervalo); // Frena la animación
            
            // Elige el ganador final
            const resultadoFinal = therians[Math.floor(Math.random() * therians.length)];
            ruleta.innerHTML = `¡Eres un<br><span style="color:#8a2be2; font-size:30px;">${resultadoFinal}</span>!`;
            
            boton.disabled = false;
            boton.innerText = "Girar de nuevo";
        }
    }, 100); 
    
});
