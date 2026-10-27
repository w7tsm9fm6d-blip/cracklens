# CrackLens · Detección de grietas en concreto

Aplicación web de clasificación visual para el proyecto de Seminario Taller VI.

**Integrantes:** JUAN MANUEL ESCALANTE ACEVEDO y JUAN SEBASTIAN VELEZ BARONA.

**Página web:** https://w7tsm9fm6d-blip.github.io/cracklens/

## Usar la aplicación

1. Selecciona una fotografía cercana de concreto en JPG, PNG o WEBP, o elige uno de los ejemplos.
2. Pulsa **Analizar superficie**.
3. Revisa la clasificación y la puntuación de grieta. Puedes descargar el resultado en JSON o abrir el informe PDF.

Las fotos se procesan en el navegador. El visitante no necesita cuenta de GitHub ni de ChatGPT. La página no usa claves API, servidor Python ni una base de datos.

## Modelo y tecnología

Los pesos proceden del clasificador entrenado en Python/NumPy sobre características de imagen HOG, intensidad y energía de borde. La red tiene 64 neuronas ocultas. OpenCV.js 4.13.0 ejecuta sus productos matriciales y la activación ReLU mediante WebAssembly en el navegador.

La exactitud interna original fue de 81,3 % sobre 316 imágenes de prueba. No es una garantía para cualquier fotografía nueva. El modelo clasifica la imagen completa; no mide el ancho ni la gravedad de una grieta y no determina seguridad estructural.

Se verificaron 20 fotografías contra el código Python: todas las clasificaciones coincidieron; la diferencia máxima de puntuación fue inferior a 0,000001.

## Archivos del sitio

- `index.html` y `style.css`: interfaz adaptable.
- `app.js`: carga, previsualización y descarga del resultado.
- `inference.js`: extracción de características y referencia de inferencia JavaScript.
- `model-data.js`: pesos aprendidos y normalización.
- `opencv-engine.js`: ejecución del modelo con OpenCV.js.
- `vendor/opencv.js`: OpenCV y su WebAssembly incluidos localmente.
- `vendor/OPENCV_LICENSE.txt` y `OPENCV_COPYRIGHT.txt`: licencia y atribución de la biblioteca.
- `ejemplo-grieta.png` y `ejemplo-sin-grieta.png`: imágenes de demostración.
- `Informe_Proyecto_CrackLens.pdf`: informe de dos páginas.

El código de entrenamiento Python, pesos originales `.npz`, datos y evidencias se entregan además en el paquete completo del proyecto. Los datos de entrenamiento no son necesarios para ejecutar la web.

## Ejecutar localmente

Desde la raíz del repositorio:

```text
python -m http.server 8000
```

Abre `http://localhost:8000`. No hay instalación de paquetes ni compilación para servir la web.

## Atribución

Dataset: [MCBDD-ZRE / Concrete Bridge Crack Dataset](https://github.com/MCBDD-ZRE/Concrete-Bridge-Crack-Dataset-), para uso académico y de investigación.

Biblioteca: [OpenCV.js](https://docs.opencv.org/4.13.0/d0/d84/tutorial_js_usage.html). OpenCV es una de las herramientas sugeridas en el enunciado. El alojamiento público se realiza mediante GitHub Pages.
