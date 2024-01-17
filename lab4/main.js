const canvas = document.getElementById('bmpCanvas');
const context = canvas.getContext('2d');

const bmpOriginalImage = document.getElementById('bmpOriginal');

const paletteOffset = 54;

function getPaletteColors(palette) {
  const colors = [];

  for (let i = 0; i < palette.length; i += 4) {
    const blue = palette[i];
    const green = palette[i + 1];
    const red = palette[i + 2];

    colors.push({ red, green, blue });
  }

  return colors;
}

function extractPalette(bmpData, paletteSize) {
  return bmpData.subarray(paletteOffset, paletteOffset + paletteSize * 4);
}

function display16ColorsBMP(bmpData) {
  const palette = extractPalette(bmpData, 16);

  const width = bmpData[18] + (bmpData[19] << 8);
  const height = bmpData[22] + (bmpData[23] << 8);

  const paletteColors = getPaletteColors(palette);

  let pixelsDataOffset = bmpData[10] + (bmpData[11] << 8);
  for (let j = height; j > 0; --j) {
    for (let i = 0; i < width; i += 2) {
      const byteValue = bmpData[pixelsDataOffset];
      const colorIndex1 = byteValue & 0x0f;
      const colorIndex2 = (byteValue >> 4) & 0x0f;

      const color1 = paletteColors[colorIndex1];
      const color2 = paletteColors[colorIndex2];

      context.fillStyle = `rgb(${color1.red}, ${color1.green}, ${color1.blue})`;
      context.fillRect(i, j, 1, 1);

      context.fillStyle = `rgb(${color2.red}, ${color2.green}, ${color2.blue})`;
      context.fillRect(i + 1, j, 1, 1);
      pixelsDataOffset += 1;
    }
  }
}

function display256ColorsBMP(bmpData) {
  const palette = extractPalette(bmpData, 256);

  const width = bmpData[18] + (bmpData[19] << 8);
  const height = bmpData[22] + (bmpData[23] << 8);

  const paletteColors = getPaletteColors(palette);

  let pixelsDataOffset = bmpData[10] + (bmpData[11] << 8);
  for (let j = height; j > 0; --j) {
    for (let i = 0; i < width; ++i) {
      const byteValue = bmpData[pixelsDataOffset];
      const color = paletteColors[byteValue];

      context.fillStyle = `rgb(${color.red}, ${color.green}, ${color.blue})`;
      context.fillRect(i, j, 1, 1);

      pixelsDataOffset += 1;
    }
  }
}

function displayTrueColorBMP(bmpData) {
  const width = bmpData[18] + (bmpData[19] << 8);
  const height = bmpData[22] + (bmpData[23] << 8);

  let pixelsDataOffset = bmpData[10] + (bmpData[11] << 8);

  for (let j = height; j > 0; --j) {
    for (let i = 0; i < width; ++i) {
      const blue = bmpData[pixelsDataOffset];
      const green = bmpData[pixelsDataOffset + 1];
      const red = bmpData[pixelsDataOffset + 2];

      context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      context.fillRect(i, j, 1, 1);

      pixelsDataOffset += 3;
    }
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function handleLoadEvent(e) {
      const bmpData = new Uint8Array(e.target.result);
      const bitCount = bmpData[28];

      switch (bitCount) {
        case 4:
          display16ColorsBMP(bmpData);
          break;
        case 8:
          display256ColorsBMP(bmpData);
          break;
        case 24:
          displayTrueColorBMP(bmpData);
          break;
        default:
          alert('Загружаемое изображение имеет неподходящий размер палитры!');
          return;
      }

      bmpOriginalImage.src = URL.createObjectURL(file);
      bmpOriginalImage.style.display = 'block';
    };

    reader.readAsArrayBuffer(file);
  }
}

document.getElementById('bmpFileInput').addEventListener('change', handleFileSelect);
