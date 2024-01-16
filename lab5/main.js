import readline from "readline";
import chalk from "chalk";
import {promisify} from "util";
import fs from "fs";

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getRatio() {
    return new Promise((resolve, reject) => {
        rl.question(chalk.green.bold("Введите коэффициент масштабирования от 0.1 до 10."), ratioInput => {
            const ratio = parseFloat(ratioInput);

            if (isNaN(ratio) || ratio < 0.1 || ratio > 10) {
                reject("Некорректное значение!");
            } else {
                resolve(ratio);
            }
        });
    })
}

async function transformImage(fileName, ratio) {
    try {
        const bmpData = await readFileAsync(fileName);

        const size = bmpData.readUInt32LE(2);
        const pixelsDataOffset = bmpData.readUInt32LE(10);
        const width = bmpData.readUInt32LE(18);
        const height = bmpData.readUInt32LE(22);

        const scaledWidth = Math.floor(width * ratio);
        const scaledHeight = Math.floor(height * ratio);

        const newHeader = Buffer.alloc(pixelsDataOffset);
        bmpData.copy(newHeader, 0, 0, pixelsDataOffset);
        newHeader.writeUInt32LE(scaledWidth, 18);
        newHeader.writeUInt32LE(scaledHeight, 22);

        const scaledPixelsData = Buffer.alloc(scaledWidth * scaledHeight);

        for (let i = 0; i < scaledWidth; ++i) {
            for (let j = 0; j < scaledHeight; ++j) {
                const oldX = Math.floor(i / ratio);
                const oldY = Math.floor(j / ratio);

                const oldPixelOffset = pixelsDataOffset + (oldY * width + oldX);
                const newPixelOffset = j * scaledWidth + i;

                scaledPixelsData[newPixelOffset] = bmpData[oldPixelOffset];
            }
        }

        const finalBuffer = Buffer.concat([newHeader, scaledPixelsData]);

        await writeFileAsync("scaled.bmp", finalBuffer);
    } catch (error) {
        throw error;
    }
}


getRatio().then((ratio) => {
    transformImage("bmp-examples/example8bit.bmp", ratio);
    rl.close();
}).catch(error => {
    console.error(chalk.red.bold(error));
    rl.close();
});
