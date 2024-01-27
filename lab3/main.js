import fs from 'fs';
import chalk from 'chalk';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

async function rotateBMP(fileName) {
  const bmpData = await readFileAsync(fileName);

  const pixelsDataOffset = bmpData.readUInt32LE(10);

  const width = bmpData.readUInt32LE(18);
  const height = bmpData.readUInt32LE(22);

  const outputBuffer = Buffer.alloc(bmpData.length);
  bmpData.copy(outputBuffer, 0, 0, pixelsDataOffset);

  outputBuffer.writeUInt32LE(height, 18);
  outputBuffer.writeUInt32LE(width, 22);

  for (let i = 0; i < width; ++i) {
    for (let j = 0; j < height; ++j) {
      const oldPixelPlace = pixelsDataOffset + ((height - j - 1) * width + i) * 3;
      const newPixelPlace = pixelsDataOffset + ((width - i - 1) * height + j) * 3;

      bmpData.copy(outputBuffer, newPixelPlace, oldPixelPlace, oldPixelPlace + 3);
    }
  }

  await writeFileAsync('output/rotatedImage.bmp', outputBuffer);

  return 'Изображение успешно развернуто на 90 градусов!';
}

rotateBMP('input/example24bit.bmp')
  .then((result) => {
    console.log(chalk.white.bold(result));
  })
  .catch((error) => {
    console.error(chalk.red.bold('Ошибка при развороте изображения на 90 градусов:\n'), error);
  });
