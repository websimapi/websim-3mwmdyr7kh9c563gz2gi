import { colorDistance, rgbToCssString } from 'utils';

// DOM Elements
const imageLoader = document.getElementById('imageLoader');
const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdValueSpan = document.getElementById('thresholdValue');
const selectedColorsContainer = document.getElementById('selectedColorsContainer');
const removeBgButton = document.getElementById('removeBgButton');
const downloadLink = document.getElementById('downloadLink');

const inputCanvas = document.getElementById('inputCanvas');
const outputCanvas = document.getElementById('outputCanvas');
const inputCtx = inputCanvas.getContext('2d');
const outputCtx = outputCanvas.getContext('2d');

const inputCanvasMessage = document.getElementById('inputCanvasMessage');
const outputCanvasMessage = document.getElementById('outputCanvasMessage');

// State
let currentImage = null;
let selectedColors = [];
let currentThreshold = parseInt(thresholdSlider.value, 10);

// Initial setup
function init() {
    // Set default canvas sizes (will be overridden by image)
    inputCanvas.width = 300; 
    inputCanvas.height = 200;
    outputCanvas.width = 300;
    outputCanvas.height = 200;
    // Draw placeholder background or message on canvas
    inputCtx.fillStyle = '#e0e0e0';
    inputCtx.fillRect(0,0,inputCanvas.width, inputCanvas.height);
    outputCtx.fillStyle = '#e0e0e0';
    outputCtx.fillRect(0,0,outputCanvas.width, outputCanvas.height);


    imageLoader.addEventListener('change', handleImageUpload);
    thresholdSlider.addEventListener('input', handleThresholdChange);
    inputCanvas.addEventListener('click', handleCanvasClick);
    removeBgButton.addEventListener('click', processImage);

    updateControlsState();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImage = new Image();
            currentImage.onload = () => {
                inputCanvas.width = currentImage.naturalWidth;
                inputCanvas.height = currentImage.naturalHeight;
                outputCanvas.width = currentImage.naturalWidth;
                outputCanvas.height = currentImage.naturalHeight;

                inputCtx.drawImage(currentImage, 0, 0);
                
                selectedColors = [];
                updateSelectedColorsDisplay();
                clearOutputCanvas();
                inputCanvasMessage.style.display = 'none';
                outputCanvasMessage.style.display = 'block';
                outputCanvasMessage.textContent = 'Result will appear here after processing.';
                downloadLink.style.display = 'none';
                updateControlsState();
            };
            currentImage.onerror = () => {
                alert("Error loading image. Please try a different file.");
                inputCanvasMessage.textContent = "Failed to load image.";
                currentImage = null;
                updateControlsState();
            };
            currentImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else if (file) {
        alert("Please upload a valid image file (e.g., PNG, JPG, GIF).");
        imageLoader.value = ""; // Reset file input
    }
}

function handleThresholdChange(event) {
    currentThreshold = parseInt(event.target.value, 10);
    thresholdValueSpan.textContent = currentThreshold;
}

function handleCanvasClick(event) {
    if (!currentImage) return;

    const rect = inputCanvas.getBoundingClientRect();
    // Calculate scale factors if canvas is rendered smaller/larger than its bitmap size
    const scaleX = inputCanvas.width / rect.width;
    const scaleY = inputCanvas.height / rect.height;
    
    // Adjust mouse coordinates for canvas scaling
    const x = Math.round((event.clientX - rect.left) * scaleX);
    const y = Math.round((event.clientY - rect.top) * scaleY);

    // Ensure coordinates are within canvas bounds
    if (x < 0 || x >= inputCanvas.width || y < 0 || y >= inputCanvas.height) return;

    const pixelData = inputCtx.getImageData(x, y, 1, 1).data;
    const clickedColor = { r: pixelData[0], g: pixelData[1], b: pixelData[2] };

    if (event.shiftKey) {
        if (!selectedColors.find(c => c.r === clickedColor.r && c.g === clickedColor.g && c.b === clickedColor.b)) {
            selectedColors.push(clickedColor);
        }
    } else {
        selectedColors = [clickedColor];
    }
    updateSelectedColorsDisplay();
    updateControlsState();
}

function updateSelectedColorsDisplay() {
    selectedColorsContainer.innerHTML = '';
    selectedColors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = rgbToCssString(color);
        swatch.title = `RGB(${color.r}, ${color.g}, ${color.b})\nClick image to replace, Shift-click to add more.`;
        selectedColorsContainer.appendChild(swatch);
    });
}

function processImage() {
    if (!currentImage) {
        alert("Please upload an image first.");
        return;
    }
    if (selectedColors.length === 0) {
        alert("Please select at least one background color by clicking on the original image.");
        return;
    }

    outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    const originalImageData = inputCtx.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
    const newImageData = outputCtx.createImageData(inputCanvas.width, inputCanvas.height);
    
    const data = originalImageData.data;
    const newData = newImageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const pixelColor = { r: data[i], g: data[i+1], b: data[i+2] };
        let isBackground = false;

        for (const sColor of selectedColors) {
            if (colorDistance(pixelColor, sColor) <= currentThreshold) {
                isBackground = true;
                break;
            }
        }

        if (isBackground) {
            newData[i+3] = 0; // Set Alpha to 0 (transparent)
            // RGB values don't matter for fully transparent pixels but could be set to 0
            newData[i] = 0; 
            newData[i+1] = 0;
            newData[i+2] = 0;
        } else {
            newData[i] = data[i];     // R
            newData[i+1] = data[i+1]; // G
            newData[i+2] = data[i+2]; // B
            newData[i+3] = data[i+3]; // Alpha
        }
    }

    outputCtx.putImageData(newImageData, 0, 0);
    outputCanvasMessage.style.display = 'none';

    downloadLink.href = outputCanvas.toDataURL('image/png');
    downloadLink.download = 'removed-bg-result.png';
    downloadLink.style.display = 'block';
}

function clearOutputCanvas() {
    outputCtx.fillStyle = '#e0e0e0';
    outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    outputCanvasMessage.style.display = 'block';
    outputCanvasMessage.textContent = 'Result will appear here after processing.';
    downloadLink.style.display = 'none';
}

function updateControlsState() {
    const imageLoaded = !!currentImage;
    const colorsSelected = selectedColors.length > 0;

    thresholdSlider.disabled = !imageLoaded;
    removeBgButton.disabled = !(imageLoaded && colorsSelected);
}

document.addEventListener('DOMContentLoaded', init);

