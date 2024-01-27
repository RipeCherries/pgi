import readline from 'readline';
import chalk from 'chalk';
import { promisify } from 'util';
import fs from 'fs';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getScale() {
  return new Promise((resolve, reject) => {
    rl.question(chalk.green.bold('Введите коэффициент масштабирования от 0.1 до 10: '), (inputScale) => {
      const scale = parseFloat(inputScale);

      if (Number.isNaN(scale) || scale < 0.1 || scale > 10) {
        reject(new Error('Некорректное значение!'));
      } else {
        resolve(scale);
      }
    });
  });
}

async function transformImage(fileName, scale) {
  const bmpData = await readFileAsync(fileName);

  const pixelsDataOffset = bmpData.readUInt32LE(10);
  const width = bmpData.readUInt32LE(18);
  const height = bmpData.readUInt32LE(22);

  const scaledWidth = Math.floor(width * scale);
  const scaledHeight = Math.floor(height * scale);

  const newHeader = Buffer.alloc(pixelsDataOffset);
  bmpData.copy(newHeader, 0, 0, pixelsDataOffset);
  newHeader.writeUInt32LE(scaledWidth, 18);
  newHeader.writeUInt32LE(scaledHeight, 22);

  const scaledPixelsData = Buffer.alloc(scaledWidth * scaledHeight);

  for (let i = 0; i < scaledWidth; ++i) {
    for (let j = 0; j < scaledHeight; ++j) {
      const oldX = Math.floor(i * (width / scaledWidth));
      const oldY = Math.floor(j * (height / scaledHeight));

      const oldPixelOffset = pixelsDataOffset + (oldY * width + oldX);
      const newPixelOffset = j * scaledWidth + i;

      scaledPixelsData[newPixelOffset] = bmpData[oldPixelOffset];
    }
  }

  const finalBuffer = Buffer.concat([newHeader, scaledPixelsData]);

  await writeFileAsync(`output/scaledX${scale}.bmp`, finalBuffer);

  return 'Изображение успешно масштабировано!';
}

getScale()
  .then((ratio) => {
    transformImage('input/example8bit.bmp', ratio)
      .then((result) => {
        console.log(chalk.white.bold(result));
      })
      .catch((error) => {
        console.error(chalk.red.bold('Ошибка при масштабировании:\n'), error);
      });
    rl.close();
  })
  .catch((error) => {
    console.error(chalk.red.bold(error));
    rl.close();
  });
