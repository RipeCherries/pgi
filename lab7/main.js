import fs from 'fs';
import { promisify } from 'util';
import chalk from 'chalk';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const mask = {
  10: [1, 1],
  20: [3, 2],
  50: [15, 4],
};

async function writeTextToBMP(bmpFileName, textFileName, percents) {
  const bmpData = await readFileAsync(bmpFileName);
  const textData = await readFileAsync(textFileName);

  const pixelsDataOffset = bmpData.readUInt32LE(10);

  let textBits = textData.reduce(
    (previousValue, currentValue) => previousValue + currentValue.toString(2).padStart(8, '0'),
    '',
  );

  textBits += '00000000';

  for (let j = 0; j < bmpData.readUInt32LE(22); ++j) {
    for (let i = 0; i < bmpData.readUInt32LE(18); ++i) {
      const offset = pixelsDataOffset + (j * bmpData.readUInt32LE(18) + i) * 3;

      if (textBits.length > 0) {
        bmpData[offset] &= ~mask[percents][0];
        bmpData[offset] |= parseInt(textBits.substring(0, mask[percents][1]), 2);
        textBits = textBits.slice(mask[percents][1]);
      } else {
        break;
      }

      if (textBits.length > 0) {
        bmpData[offset + 1] &= ~mask[percents][0];
        bmpData[offset + 1] |= parseInt(textBits.substring(0, mask[percents][1]), 2);
        textBits = textBits.slice(mask[percents][1]);
      } else {
        break;
      }

      if (textBits.length > 0) {
        bmpData[offset + 2] &= ~mask[percents][0];
        bmpData[offset + 2] |= parseInt(textBits.substring(0, mask[percents][1]), 2);
        textBits = textBits.slice(mask[percents][1]);
      } else {
        break;
      }
    }
  }

  await writeFileAsync('output/stenography.bmp', bmpData);

  return 'Текст успешно вписан в изображение!';
}

async function readTextFromBMP(bmpFileName, percents) {
  const bmpData = await readFileAsync(bmpFileName);
  const pixelsDataOffset = bmpData.readUInt32LE(10);

  let readText = '';

  for (let j = 0; j < bmpData.readUInt32LE(22); ++j) {
    for (let i = 0; i < bmpData.readUInt32LE(18); ++i) {
      const offset = pixelsDataOffset + (j * bmpData.readUInt32LE(18) + i) * 3;

      readText += (bmpData[offset] & mask[percents][0]).toString(2).padStart(mask[percents][1], '0');
      readText += (bmpData[offset + 1] & mask[percents][0]).toString(2).padStart(mask[percents][1], '0');
      readText += (bmpData[offset + 2] & mask[percents][0]).toString(2).padStart(mask[percents][1], '0');
    }
  }

  for (let i = 0; i < readText.length; i += 8) {
    if (readText.slice(i, i + 8) === '00000000') {
      readText = readText.slice(0, i);
      break;
    }
  }

  const textBuffer = Buffer.alloc(readText.length / 8);

  for (let i = 0; i < readText.length; i += 8) {
    const byte = parseInt(readText.slice(i, i + 8), 2);
    textBuffer.writeUInt8(byte, i / 8);
  }

  const extractedResult = textBuffer.toString('utf8');

  await writeFileAsync('output/readText.txt', extractedResult);

  return 'Извлечённый из изображения текст успешно записан в файл!';
}

async function compareFiles(originalFileName, extractedFileName) {
  const originalData = await readFileAsync(originalFileName);
  const extractedData = await readFileAsync(extractedFileName);

  if (Math.abs(originalData.length - extractedData.length) <= 2) {
    return 'Исходный файл и извлечённый файл идентичны.';
  } 
    return 'Исходный файл и извлечённый файл не совпадают.';
  
}

const textFile = {
  fileName: 'input/text50percents.txt',
  percents: 50,
};

writeTextToBMP('input/example24bit.bmp', textFile.fileName, textFile.percents)
  .then((writeResult) => {
    console.log(chalk.white.bold(writeResult));

    readTextFromBMP('output/stenography.bmp', textFile.percents)
      .then((readResult) => {
        console.log(chalk.white.bold(readResult));

        compareFiles(textFile.fileName, 'output/readText.txt')
          .then((comparisonResult) => {
            console.log(chalk.white.bold(comparisonResult));
          })
          .catch((comparisonError) => {
            console.error(chalk.red.bold('Ошибка при сравнении файлов:\n'), comparisonError);
          });
      })
      .catch((readError) => {
        console.error(chalk.red.bold('Ошибка при извлечении текста из изображения:\n'), readError);
      });
  })
  .catch((writeError) => {
    console.error(chalk.red.bold('Ошибка при записи текста в изображение:\n'), writeError);
  });
