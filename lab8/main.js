const canvas = document.getElementById('pcxCanvas');
const context = canvas.getContext('2d');

function displayPCX(pcxData) {
  const decodedData = new PCX(pcxData).decode();
  console.log(decodedData);
  const imageData = context.createImageData(decodedData.width, decodedData.height);
  imageData.data.set(decodedData.pixelsData);

  context.putImageData(imageData, 0, 0);
}

function handleFileSelect(event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function handleLoadEvent(e) {
      displayPCX(new Uint8Array(e.target.result));
    };

    reader.readAsArrayBuffer(file);
  }
}

document.getElementById('pcxFileInput').addEventListener('change', handleFileSelect);
