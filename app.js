const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');
const boton = document.getElementById('btn-descubrir');
const ruleta = document.getElementById('ruleta');

// 1. LISTA MAESTRA DE ANIMALES Y SUS ARCHIVOS EXACTOS
const therians = [
    { emoji: "🐺 Lobo", archivoOrejas: "orejas-lobo.png", archivoCentro: "hocico-lobo.png" },
    { emoji: "🐱 Gato", archivoOrejas: "orejas-gato.png", archivoCentro: "nariz-gato.png" },
    { emoji: "🦊 Zorro", archivoOrejas: "orejas-zorro.png", archivoCentro: "hocico-zorro.png" },
    { emoji: "🐶 Perro", archivoOrejas: "orejas-perro.png", archivoCentro: "hocico-perro.png" },
    { emoji: "🦅 Águila", archivoOrejas: null, archivoCentro: "pico-aguila.png" }, // El águila no lleva orejas
    { emoji: "🐻 Oso", archivoOrejas: "orejas-oso.png", archivoCentro: "hocico-oso.png" },
    { emoji: "🦌 Ciervo", archivoOrejas: "cuernos-ciervo.png", archivoCentro: "nariz-ciervo.png" },
    { emoji: "🐾 Lince", archivoOrejas: "orejas-lince.png", archivoCentro: "hocico-lince.png" }
];

let animalActual = null; 
let assets = {}; 

// 2. CARGAR LAS IMÁGENES EN LA MEMORIA
therians.forEach(animal => {
    assets[animal.emoji] = {
        orejas: new Image(),
        centro: new Image()
    };
    // Solo carga la imagen si existe en la lista
    if(animal.archivoOrejas) assets[animal.emoji].orejas.src = animal.archivoOrejas;
    if(animal.archivoCentro) assets[animal.emoji].centro.src = animal.archivoCentro; 
});

// 3. LA RULETA Y ACTIVACIÓN DE LA MÁSCARA
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
            
            // Le dice a MediaPipe qué animal dibujar
            animalActual = ganador.emoji; 
            
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
        const frente = rostro[10];   
        const nariz = rostro[1];     
        const mejillaIzq = rostro[234];
        const mejillaDer = rostro[454];

        // Calculamos el ancho de tu cara para que las piezas crezcan si te acercas
        const anchoCara = Math.abs(mejillaDer.x - mejillaIzq.x) * canvas.width;
        
        const orejasImg = assets[animalActual].orejas;
        const centroImg = assets[animalActual].centro;

        // DIBUJAR OREJAS O CUERNOS
        if (orejasImg.src && orejasImg.complete && orejasImg.naturalWidth > 0) {
            const anchoOrejas = anchoCara * 1.5; // Tamaño de las orejas
            const altoOrejas = (orejasImg.height / orejasImg.width) * anchoOrejas;
            // Coordenadas para centrarlas en la frente
            const xOrejas = (frente.x * canvas.width) - (anchoOrejas / 2);
            const yOrejas = (frente.y * canvas.height) - altoOrejas + (anchoCara * 0.2); 
            
            ctx.drawImage(orejasImg, xOrejas, yOrejas, anchoOrejas, altoOrejas);
        }

        // DIBUJAR HOCICO, NARIZ O PICO
        if (centroImg.src && centroImg.complete && centroImg.naturalWidth > 0) {
            const anchoCentro = anchoCara * 0.5; // Tamaño del hocico
            const altoCentro = (centroImg.height / centroImg.width) * anchoCentro;
            // Coordenadas para centrarlo en la nariz
            const xCentro = (nariz.x * canvas.width) - (anchoCentro / 2);
            const yCentro = (nariz.y * canvas.height) - (altoCentro / 2);
            
            ctx.drawImage(centroImg, xCentro, yCentro, anchoCentro, altoCentro);
        }
    }
    ctx.restore();
}

// 5. CONFIGURACIÓN Y ENCENDIDO DE LA CÁMARA
const faceMesh = new FaceMesh({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});

faceMesh.setOptions({
  maxNumFaces: 1, 
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
