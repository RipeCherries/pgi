import chalk from 'chalk';
import { promisify } from 'util';
import fs from 'fs';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const decodingCompressionField = {
  0: 'BL_RGB | Двумерный массив',
  1: 'BL_RLE8 | RLE кодирование',
  2: 'BL_RLE4 | RLE кодирование',
  3: 'BI_BITFIELDS | двумерный массив с масками цветовых каналов',
  4: 'BI_JPEG | во встроенном JPEG-файле',
  5: 'BI_PNG | во встроенном PNG-файле',
  6: 'BI_ALPHABITFIELDS | двумерный массив с масками цветовых и альфа-канала',
};

async function getBMPFileInformation(fileName) {
  const bmpData = await readFileAsync(fileName);

  return {
    bfType: bmpData.readUInt16LE(0),
    bfSize: bmpData.readUInt32LE(2),
    biWidth: bmpData.readUInt32LE(18),
    biHeight: bmpData.readUInt32LE(22),
    biBitCount: bmpData.readUInt16LE(28),
    biCompression: bmpData.readUInt32LE(30),
    biXPelsPerMeter: bmpData.readUInt32LE(38),
    biYPelsPerMeter: bmpData.readUInt32LE(42),
  };
}

async function convertToGrayScale(fileName) {
  const bmpData = await readFileAsync(fileName);

  const paletteOffset = 54;
  const paletteSize = 256;
  const palette = bmpData.subarray(paletteOffset, paletteOffset + paletteSize * 4);

  for (let i = 0; i < palette.length; i += 4) {
    const blue = palette.readUInt8(i);
    const green = palette.readUInt8(i + 1);
    const red = palette.readUInt8(i + 2);

    const grayScale = Math.ceil((red + green + blue) / 3);

    palette.writeUInt8(grayScale, i);
    palette.writeUInt8(grayScale, i + 1);
    palette.writeUInt8(grayScale, i + 2);
  }

  palette.copy(bmpData, paletteOffset);

  await writeFileAsync('output/grayscale.bmp', bmpData);

  return 'Чёрно-белое изображение успешно сохранено!';
}

getBMPFileInformation('input/example8bit.bmp')
  .then((bmpInfo) => {
    console.log(`${chalk.green.underline('Сигнатура формата:')} ${bmpInfo.bfType.toString(16)}`);
    console.log(`${chalk.green.underline('Размер файла:')} ${bmpInfo.bfSize} байт`);
    console.log(`${chalk.green.underline('Ширина:')} ${bmpInfo.biWidth} пикселей`);
    console.log(`${chalk.green.underline('Высота:')} ${bmpInfo.biHeight} пикселей`);
    console.log(`${chalk.green.underline('Количество бит на пиксель:')} ${bmpInfo.biBitCount}`);
    console.log(
      `${chalk.green.underline('Способ хранения пикселей:')} ${decodingCompressionField[bmpInfo.biCompression]}`,
    );
    console.log(`${chalk.green.underline('Разрешение по горизонтали:')} ${bmpInfo.biXPelsPerMeter} пикселей / метр`);
    console.log(`${chalk.green.underline('Разрешение по вертикали:')} ${bmpInfo.biYPelsPerMeter} пикселей / метр`);
  })
  .catch((error) => {
    console.error(chalk.red.bold('Ошибка при получении информации о BMP файле:\n'), error);
  });

convertToGrayScale('input/example8bit.bmp')
  .then((result) => {
    console.log(chalk.white.bold(result));
  })
  .catch((error) => {
    console.error(chalk.red.bold('Ошибка при конвертации изображения в чёрно-белое:\n'), error);
  });
