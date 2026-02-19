const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');
const boton = document.getElementById('btn-descubrir');
const ruleta = document.getElementById('ruleta');

const therians = [
    { emoji: "🐺 Lobo", archivoOrejas: "orejas-lobo.png", archivoCentro: "hocico-lobo.png" },
    { emoji: "🐱 Gato", archivoOrejas: "orejas-gato.png", archivoCentro: "nariz-gato.png" },
    { emoji: "🦊 Zorro", archivoOrejas: "orejas-zorro.png", archivoCentro: "hocico-zorro.png" },
    { emoji: "🐶 Perro", archivoOrejas: "orejas-perro.png", archivoCentro: "hocico-perro.png" },
    { emoji: "🦅 Águila", archivoOrejas: null, archivoCentro: "pico-aguila.png" },
    { emoji: "🐻 Oso", archivoOrejas: "orejas-oso.png", archivoCentro: "hocico-oso.png" },
    { emoji: "🦌 Ciervo", archivoOrejas: "cuernos-ciervo.png", archivoCentro: "nariz-ciervo.png" },
    { emoji: "🐾 Lince", archivoOrejas: "orejas-lince.png", archivoCentro: "hocico-lince.png" }
];

let animalActual = null; 
let assets = {}; 
let iaLista = false; // Variable para saber si la IA ya despertó

// Cargar imágenes
therians.forEach(animal => {
    assets[animal.emoji] = { orejas: new Image(), centro: new Image() };
    if(animal.archivoOrejas) assets[animal.emoji].orejas.src = animal.archivoOrejas;
    if(animal.archivoCentro) assets[animal.emoji].centro.src = animal.archivoCentro; 
});

// Configurar FaceMesh (El cerebro)
const faceMesh = new FaceMesh({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});
faceMesh.setOptions({
  maxNumFaces: 1, refineLandmarks: false,
  minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
});

// Lo que hace cuando encuentra una cara
faceMesh.onResults((results) => {
    iaLista = true; // ¡La IA ya está lista!
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && animalActual) {
        const rostro = results.multiFaceLandmarks[0];
        const frente = rostro[10];   
        const nariz = rostro[1];     
        const mejillaIzq = rostro[234];
        const mejillaDer = rostro[454];
        
        const anchoCara = Math.abs(mejillaDer.x - mejillaIzq.x) * canvas.width;
        const orejasImg = assets[animalActual].orejas;
        const centroImg = assets[animalActual].centro;

        let dibujoAlgo = false;

        if (orejasImg.complete && orejasImg.naturalWidth > 0) {
            const anchoOrejas = anchoCara * 1.5; 
            const altoOrejas = (orejasImg.height / orejasImg.width) * anchoOrejas;
            const xOrejas = (frente.x * canvas.width) - (anchoOrejas / 2);
            const yOrejas = (frente.y * canvas.height) - altoOrejas + (anchoCara * 0.2); 
            ctx.drawImage(orejasImg, xOrejas, yOrejas, anchoOrejas, altoOrejas);
            dibujoAlgo = true;
        }

        if (centroImg.complete && centroImg.naturalWidth > 0) {
            const anchoCentro = anchoCara * 0.5; 
            const altoCentro = (centroImg.height / centroImg.width) * anchoCentro;
            const xCentro = (nariz.x * canvas.width) - (anchoCentro / 2);
            const yCentro = (nariz.y * canvas.height) - (altoCentro / 2);
            ctx.drawImage(centroImg, xCentro, yCentro, anchoCentro, altoCentro);
            dibujoAlgo = true;
        }

        // DEPURADOR: Si falla la imagen, dibuja un punto rojo en la nariz
        if (!dibujoAlgo) {
            ctx.fillStyle = "red";
            ctx.beginPath();
            ctx.arc(nariz.x * canvas.width, nariz.y * canvas.height, 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.font = "20px Arial";
            ctx.fillStyle = "white";
            ctx.fillText("Error con los PNGs", 20, 50);
        }
    }
});

// Bucle nativo (Súper estable en móviles)
async function procesarVideo() {
    if (video.readyState >= 2) { await faceMesh.send({image: video}); }
    requestAnimationFrame(procesarVideo);
}

// Encender cámara nativa
async function iniciarCamara() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
            procesarVideo(); // Arranca el motor
        };
    } catch (error) { alert("Error de cámara: " + error); }
}
iniciarCamara();

// Botón de Ruleta
boton.addEventListener('click', () => {
    // Si la IA no ha descargado, avisa al usuario
    if (!iaLista) {
        alert("La magia aún se está descargando (pesa unos 3MB). ¡Espera unos segundos más y vuelve a intentarlo!");
        return;
    }
    
    boton.disabled = true;
    ruleta.style.display = "block";
    animalActual = null; 
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    
    let tiempoGiro = 0;
    const intervalo = setInterval(() => {
        const indexAleatorio = Math.floor(Math.random() * therians.length);
        ruleta.innerText = therians[indexAleatorio].emoji;
        tiempoGiro += 100;

        if (tiempoGiro >= 3000) {
            clearInterval(intervalo);
            const ganador = therians[Math.floor(Math.random() * therians.length)];
            ruleta.innerHTML = `¡Eres un<br><span style="color:#8a2be2; font-size:30px;">${ganador.emoji}</span>!`;
            animalActual = ganador.emoji; 
            boton.disabled = false;
            boton.innerText = "Girar de nuevo";
        }
    }, 100); 
});
