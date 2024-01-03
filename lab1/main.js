import chalk from "chalk";
import { promisify } from "util";
import fs from "fs";

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const decodingCompressionField = {
    0: "BL_RGB | Двумерный массив",
    1: "BL_RLE8 | RLE кодирование",
    2: "BL_RLE4 | RLE кодирование",
    3: "BI_BITFIELDS | двумерный массив с масками цветовых каналов",
    4: "BI_JPEG | во встроенном JPEG-файле",
    5: "BI_PNG | во встроенном PNG-файле",
    6: "BI_ALPHABITFIELDS | двумерный массив с масками цветовых и альфа-канала"
}

async function getBMPFileInformation(fileName) {
    try {
        const bmpData = await readFileAsync(fileName);

        return {
            bfType: bmpData.readUInt16LE(0),
            bfSize: bmpData.readUInt32LE(2),
            biWidth: bmpData.readUInt32LE(18),
            biHeight: bmpData.readUInt32LE(22),
            biBitCount: bmpData.readUInt16LE(28),
            biCompression: bmpData.readUInt32LE(30),
            biXPelsPerMeter: bmpData.readUInt32LE(38),
            biYPelsPerMeter: bmpData.readUInt32LE(42)
        }
    } catch (error) {

    }
}

async function convertToGrayScale(fileName) {
    try {
        const bmpData = await readFileAsync(fileName);

        const outputBuffer = Buffer.alloc(bmpData.length);
        bmpData.copy(outputBuffer, 0, 0, 54);

        for (let i = 54; i < bmpData.readUInt32LE(18) * bmpData.readUInt32LE(22) * 3; i += 3) {
            const rgbtBlue = bmpData.readUInt8(i);
            const rgbtGreen = bmpData.readUInt8(i + 1);
            const rgbtRed = bmpData.readUInt8(i + 2);

            const grayScale = Math.floor((rgbtRed + rgbtGreen + rgbtBlue) / 3);

            outputBuffer.writeUInt8(grayScale, i);
            outputBuffer.writeUInt8(grayScale, i + 1);
            outputBuffer.writeUInt8(grayScale, i + 2);
        }

        await writeFileAsync('result.bmp', outputBuffer);

    } catch (error) {
        console.log(error);
    }
}

getBMPFileInformation("example1.bmp").then((bmpInfo) => {
    console.log(chalk.green.underline("Сигнатура формата:") + " " + bmpInfo.bfType.toString(16));
    console.log(chalk.green.underline("Размер файла:") + " " + bmpInfo.bfSize + " байт");
    console.log(chalk.green.underline("Ширина:") + " " + bmpInfo.biWidth + " пикселей");
    console.log(chalk.green.underline("Высота:") + " " + bmpInfo.biHeight + " пикселей");
    console.log(chalk.green.underline("Количество бит на пиксель:") + " " + bmpInfo.biBitCount);
    console.log(chalk.green.underline("Способ хранения пикселей:") + " " + decodingCompressionField[bmpInfo.biCompression]);
    console.log(chalk.green.underline("Разрешение по горизонтали:") + " " + bmpInfo.biXPelsPerMeter + " пикселей / метр");
    console.log(chalk.green.underline("Разрешение по вертикали:") + " " + bmpInfo.biYPelsPerMeter + " пикселей / метр");
})

convertToGrayScale("example1.bmp");
