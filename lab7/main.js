import fs from 'fs';
import { promisify } from 'util';
import chalk from 'chalk';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

async function writeTextToBMP(bmpFileName, textFileName) {
  const bmpData = await readFileAsync(bmpFileName);
  const textData = await readFileAsync(textFileName);

  const pixelsDataOffset = bmpData.readUInt32LE(10);

  if (textData.length * 8 > bmpData.length - pixelsDataOffset) {
    throw new Error('Текстовый файл превышает максимально допустимый размер для этого изображения');
  }

  const textBits = textData.reduce(
    (previousValue, currentValue) => previousValue + currentValue.toString(2).padStart(8, '0'),
    '',
  );

  const textBitsSize = textBits.length.toString(2).padStart(32, '0');

  for (let i = 0; i < textBitsSize.length; i++) {
    bmpData[i + pixelsDataOffset] &= ~1;
    bmpData[i + pixelsDataOffset] |= parseInt(textBitsSize[i], 2);
  }

  for (let i = 0; i < textBits.length; i++) {
    bmpData[i + textBitsSize.length + pixelsDataOffset] &= ~1;
    bmpData[i + textBitsSize.length + pixelsDataOffset] |= parseInt(textBits[i], 2);
  }

  await writeFileAsync('output/stenography.bmp', bmpData);

  return 'Текст успешно вписан в изображение!';
}

async function readTextFromBMP(bmpFileName) {
  const bmpData = await readFileAsync(bmpFileName);
  const pixelsDataOffset = bmpData.readUInt32LE(10);

  const textBitsSize = bmpData
    .subarray(pixelsDataOffset, pixelsDataOffset + 32)
    .map((byte) => byte & 1)
    .join('');
  const textSize = parseInt(textBitsSize, 2);

  let textBits = '';

  for (let i = 0; i < textSize; i++) {
    textBits += (bmpData[i + pixelsDataOffset + 32] & 1).toString();
  }

  const textBuffer = Buffer.alloc(textSize / 8);

  for (let i = 0; i < textSize; i += 8) {
    const byte = parseInt(textBits.slice(i, i + 8), 2);
    textBuffer.writeUInt8(byte, i / 8);
  }

  const extractedResult = textBuffer.toString('utf8');

  await writeFileAsync('output/readText.txt', extractedResult);

  return 'Извлечённый из изображения текст успешно записан в файл!';
}

writeTextToBMP('input/example24bit.bmp', 'input/text.txt')
  .then((writeResult) => {
    console.log(chalk.white.bold(writeResult));

    readTextFromBMP('output/stenography.bmp')
      .then((readResult) => {
        console.log(chalk.white.bold(readResult));
      })
      .catch((readError) => {
        console.error(chalk.red.bold('Ошибка при извлечении текста из изображения:\n'), readError);
      });
  })
  .catch((writeError) => {
    console.error(chalk.red.bold('Ошибка при записи текста в изображение:\n'), writeError);
  });
