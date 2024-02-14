const beforePCXCanvas = document.getElementById('beforePCXCanvas');
const beforePCXContext = beforePCXCanvas.getContext('2d');

const afterPCXCanvas = document.getElementById('afterPCXCanvas');
const afterPCXContext = afterPCXCanvas.getContext('2d');

function getDifference(color1, color2) {
  return (color1.red - color2.red) ** 2 + (color1.green - color2.green) ** 2 + (color1.blue - color2.blue) ** 2;
}

function getEuclideanDistance(color1, color2) {
  return Math.sqrt(
    (color1.red - color2.red)**2 +
      (color1.green - color2.green)**2 +
      (color1.blue - color2.blue)**2,
  );
}

function alikeColors(color1, color2, threshold) {
  return getEuclideanDistance(color1, color2) <= threshold;
}

function convertTo256Colors(decodedData) {
  const colorsNum = 256;
  const palette = new Array(colorsNum).fill({ red: 0, green: 0, blue: 0 });
  const mr = new Array(colorsNum).fill(0);
  let addedColors = 0;

  for (let i = 0; i < decodedData.pixelsData.length; i += 4) {
    const color = {
      red: decodedData.pixelsData[i],
      green: decodedData.pixelsData[i + 1],
      blue: decodedData.pixelsData[i + 2],
    };

    let foundAlike = false;
    const similarityThreshold = 10;

    for (let j = 0; j < colorsNum; ++j) {
      if (alikeColors(color, palette[j], similarityThreshold)) {
        foundAlike = true;
        break;
      }
    }

    if (!foundAlike) {
      let r = 0;

      for (let k = i + 4; k < decodedData.pixelsData.length; k += 4) {
        if (
          alikeColors(
            color,
            {
              red: decodedData.pixelsData[k],
              green: decodedData.pixelsData[k + 1],
              blue: decodedData.pixelsData[k + 2],
            },
            similarityThreshold,
          )
        ) {
          r++;
        }
      }

      if (addedColors < colorsNum) {
        palette[addedColors] = color;
        mr[addedColors] = r;
        addedColors += 1;
      } else {
        let minDifference = Number.MAX_SAFE_INTEGER;

        let k = -1;
        for (let j = 0; j < colorsNum; ++j) {
          if (r > mr[j]) {
            const difference = getDifference(color, palette[j]);
            if (difference < minDifference) {
              minDifference = difference;
              k = j;
            }
          }
        }
        if (k !== -1) {
          palette[k] = color;
          mr[k] = r;
        }
      }
    }
  }

  console.log(palette);

  let p = 0;
  for (let i = 0; i < decodedData.pixelsData.length; i += 4) {
    const color = {
      red: decodedData.pixelsData[i],
      green: decodedData.pixelsData[i + 1],
      blue: decodedData.pixelsData[i + 2],
    };

    let minDifference = Number.MAX_SAFE_INTEGER;
    let k;

    for (let j = 0; j < colorsNum; ++j) {
      const difference = getDifference(color, palette[j]);
      if (difference < minDifference) {
        minDifference = difference;
        k = j;
      }
    }
    decodedData.pixelsData[p] = palette[k].red;
    decodedData.pixelsData[p + 1] = palette[k].green;
    decodedData.pixelsData[p + 2] = palette[k].blue;
    p += 4;
  }

  return {
    width: decodedData.width,
    height: decodedData.height,
    pixelsData: decodedData.pixelsData,
  };
}

function displayPCX(pcxData) {
  const decodedData = new PCX(pcxData).decode();

  const imageDataBefore = beforePCXContext.createImageData(decodedData.width, decodedData.height);
  imageDataBefore.data.set(decodedData.pixelsData);
  beforePCXContext.putImageData(imageDataBefore, 0, 0);

  const convertedData = convertTo256Colors(decodedData);

  const imageDataAfter = afterPCXContext.createImageData(convertedData.width, convertedData.height);
  imageDataAfter.data.set(convertedData.pixelsData);
  afterPCXContext.putImageData(imageDataAfter, 0, 0);
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
