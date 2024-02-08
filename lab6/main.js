import chalk from 'chalk';
import { promisify } from 'util';
import fs from 'fs';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

async function embedWatermark(mainFileName, logoFileName) {
  const mainData = await readFileAsync(mainFileName);
  const logoData = await readFileAsync(logoFileName);

  const mainWidth = mainData.readUInt32LE(18);
  const mainHeight = mainData.readUInt32LE(22);
  const mainPixelsDataOffset = mainData.readUInt32LE(10);

  const logoWidth = logoData.readUInt32LE(18);
  const logoHeight = logoData.readUInt32LE(22);
  const logoPixelsDataOffset = logoData.readUInt32LE(10);

  const embedX = Math.floor((mainWidth - logoWidth) / 2);
  const embedY = Math.floor((mainHeight - logoHeight) / 2);

  const backgroundColor = {
    blue: logoData.readUInt8(logoPixelsDataOffset),
    green: logoData.readUInt8(logoPixelsDataOffset + 1),
    red: logoData.readUInt8(logoPixelsDataOffset + 2),
  };

  const k = 0.5;
  const allowedOffset = 10;

  for (let j = 0; j < logoHeight; ++j) {
    for (let i = 0; i < logoWidth; ++i) {
      const logoPixel = (j * logoWidth + i) * 3;
      const mainPixelOffset = mainPixelsDataOffset + ((embedY + j) * mainWidth + (embedX + i)) * 3;

      const mainColor = {
        blue: mainData.readUInt8(mainPixelOffset),
        green: mainData.readUInt8(mainPixelOffset + 1),
        red: mainData.readUInt8(mainPixelOffset + 2),
      };

      const logoColor = {
        blue: logoData.readUInt8(logoPixelsDataOffset + logoPixel),
        green: logoData.readUInt8(logoPixelsDataOffset + logoPixel + 1),
        red: logoData.readUInt8(logoPixelsDataOffset + logoPixel + 2),
      };

      if (
        (logoColor.blue < backgroundColor.blue - allowedOffset ||
          logoColor.blue > backgroundColor.blue + allowedOffset) &&
        (logoColor.green < backgroundColor.green - allowedOffset ||
          logoColor.green > backgroundColor.green + allowedOffset) &&
        (logoColor.red < backgroundColor.red - allowedOffset || logoColor.red > backgroundColor.red + allowedOffset)
      ) {
        const blendedColor = {
          blue: mainColor.blue * k + logoColor.blue * (1 - k),
          green: mainColor.green * k + logoColor.green * (1 - k),
          red: mainColor.red * k + logoColor.red * (1 - k),
        };

        mainData.writeUInt8(blendedColor.blue, mainPixelOffset);
        mainData.writeUInt8(blendedColor.green, mainPixelOffset + 1);
        mainData.writeUInt8(blendedColor.red, mainPixelOffset + 2);
      }
    }
  }

  await writeFileAsync('output/watermark.bmp', mainData);

  return 'Логотип успешно вписан в изображение!';
}

embedWatermark('input/example24bit.bmp', 'input/logo.bmp')
  .then((result) => {
    console.log(chalk.white.bold(result));
  })
  .catch((error) => {
    console.error(chalk.red.bold('Ошибка при вписывании логотипа в изображение:\n'), error);
  });
