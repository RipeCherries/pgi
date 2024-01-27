import fs from 'fs';
import chalk from 'chalk';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

function getRandomColor() {
  const red = Math.floor(Math.random() * 256);
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);

  return [blue, green, red];
}

async function addBorderToBMP(fileName) {
  const bmpData = await readFileAsync(fileName);

  const pixelsDataOffset = bmpData.readUInt32LE(10);

  const width = bmpData.readUInt32LE(18);
  const height = bmpData.readUInt32LE(22);

  for (let i = 0; i < width; ++i) {
    for (let j = 0; j < height; ++j) {
      const isBorderPixel = i < 15 || i >= width - 15 || j < 15 || j >= height - 15;

      if (isBorderPixel) {
        const offset = pixelsDataOffset + (j * width + i) * 3;

        const randomColor = getRandomColor();
        bmpData.writeUInt8(randomColor[0], offset);
        bmpData.writeUInt8(randomColor[1], offset + 1);
        bmpData.writeUInt8(randomColor[2], offset + 2);
      }
    }
  }

  await writeFileAsync('output/randomBorder.bmp', bmpData);

  return 'Рамка из случайных цветов успешно создана!';
}

addBorderToBMP('input/example24bit.bmp')
  .then((result) => {
    console.log(chalk.white.bold(result));
  })
  .catch((error) => {
    console.error(chalk.red.bold('Ошибка при создании рамки:\n'), error);
  });
