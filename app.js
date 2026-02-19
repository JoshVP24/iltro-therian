const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');
const boton = document.getElementById('btn-descubrir');
const ruleta = document.getElementById('ruleta');

// 1. LISTA DE ANIMALES Y SUS ARCHIVOS
// Aquí agregarás los demás animales asegurándote que los nombres coincidan con tus PNGs
const therians = [
    { emoji: "🐺 Lobo", archivo: "lobo" }
    // Ejemplo de cómo agregar más después:
    // ,{ emoji: "🐱 Gato", archivo: "gato" }
];

let animalActual = null; 
let assets = {}; 

// 2. CARGAR LAS IMÁGENES EN LA MEMORIA
therians.forEach(animal => {
    assets[animal.archivo] = {
        orejas: new Image(),
        hocico: new Image()
    };
    assets[animal.archivo].orejas.src = `orejas-${animal.archivo}.png`;
    assets[animal.archivo].hocico.src = `hocico-${animal.archivo}.png`; 
});

// 3. LA RULETA ACTUALIZADA
boton.addEventListener('click', () => {
    boton.disabled = true;
    ruleta.style.display = "block";
    animalActual = null; // Quita la máscara anterior mientras gira
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
            
            // ¡Esta línea activa la máscara de MediaPipe!
            animalActual = ganador.archivo; 
            
            boton.disabled = false;
            boton.innerText = "Girar de nuevo";
        }
    }, 100); 
});

// 4. EL CEREBRO DE RECONOCIMIENTO FACIAL (MEDIAPIPE)
function onResults(results) {
    // Igualar el lienzo al tamaño de tu cámara
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Si detecta una cara y la ruleta ya eligió un animal...
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && animalActual) {
        const rostro = results.multiFaceLandmarks[0];
        
        // Puntos topográficos de la cara
        const frente = rostro[10];   // Centro superior de la frente
        const nariz = rostro[1];     // Punta de la nariz
        const mejillaIzq = rostro[234];
        const mejillaDer = rostro[454];

        // Calculamos el ancho de tu cara para que las orejas crezcan si te acercas
        const anchoCara = Math.abs(mejillaDer.x - mejillaIzq.x) * canvas.width;
        
        const orejasImg = assets[animalActual].orejas;
        const hocicoImg = assets[animalActual].hocico;

        // DIBUJAR OREJAS
        if (orejasImg.complete && orejasImg.naturalWidth > 0) {
            const anchoOrejas = anchoCara * 1.5; // Qué tan grandes se ven
            const altoOrejas = (orejasImg.height / orejasImg.width) * anchoOrejas;
            // Coordenadas matemáticas para centrarlas
            const xOrejas = (frente.x * canvas.width) - (anchoOrejas / 2);
            const yOrejas = (frente.y * canvas.height) - altoOrejas + (anchoCara * 0.2); 
            
            ctx.drawImage(orejasImg, xOrejas, yOrejas, anchoOrejas, altoOrejas);
        }

        // DIBUJAR HOCICO
        if (hocicoImg.complete && hocicoImg.naturalWidth > 0) {
            const anchoHocico = anchoCara * 0.5; // Qué tan grande se ve
            const altoHocico = (hocicoImg.height / hocicoImg.width) * anchoHocico;
            // Coordenadas matemáticas para centrarlo
            const xHocico = (nariz.x * canvas.width) - (anchoHocico / 2);
            const yHocico = (nariz.y * canvas.height) - (altoHocico / 2);
            
            ctx.drawImage(hocicoImg, xHocico, yHocico, anchoHocico, altoHocico);
        }
    }
    ctx.restore();
}

// 5. CONFIGURACIÓN Y ENCENDIDO DE LA CÁMARA
const faceMesh = new FaceMesh({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});

faceMesh.setOptions({
  maxNumFaces: 1, // Solo buscar 1 cara
  refineLandmarks: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

const camera = new Camera(video, {
  onFrame: async () => {
    await faceMesh.send({image: video});
  },
  width: 480,
  height: 640
});
camera.start();
