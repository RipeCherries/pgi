class PCX {
  #buffer;

  #byteView;

  #header;

  #width;

  #height;

  #palette;

  #pixelsData;

  constructor(buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw new Error('Invalid input: must be a Uint8Array');
    }

    this.#buffer = buffer;
    this.#byteView = buffer;

    this.#readHeader();
  }

  #readLEWord(offset) {
    return this.#byteView[offset] | (this.#byteView[offset + 1] << 8);
  }

  #isPCXFile() {
    return this.#byteView && this.#byteView[0] === 10;
  }

  #readHeader() {
    if (!this.#isPCXFile()) {
      throw new Error('Not a PCX File');
    }

    this.#header = {
      id: this.#byteView[0],
      version: this.#byteView[1],
      encoding: this.#byteView[2],
      bpp: this.#byteView[3],
      xMin: this.#readLEWord(4),
      yMin: this.#readLEWord(6),
      xMax: this.#readLEWord(8),
      yMax: this.#readLEWord(10),
      xDPI: this.#readLEWord(12),
      yDPI: this.#readLEWord(14),
      palette: this.#byteView.slice(16, 64),
      reserved: this.#byteView[64],
      planes: this.#byteView[65],
      bpr: this.#readLEWord(66),
      paletteInfo: this.#readLEWord(68),
      hScreenSize: this.#readLEWord(70),
      vScreenSize: this.#readLEWord(72),
      filler: this.#byteView.slice(74, 128),
    };

    this.#width = this.#header.xMax - this.#header.xMin + 1;
    this.#height = this.#header.yMax - this.#header.yMin + 1;
  }

  decode() {
    switch (this.#header.bpp) {
      case 1:
        this.#decode4bpp();
        break;
      case 8:
        this.#decode8bpp();
        break;
      default:
        throw new Error('Unsupported bpp');
    }

    return {
      header: this.#header,
      width: this.#width,
      height: this.#height,
      palette: this.#palette,
      pixelsData: this.#pixelsData,
    };
  }

  #getPalette() {
    if (this.#header.bpp === 8 && this.#byteView[this.#buffer.byteLength - 769] === 12) {
      this.#palette = new Uint8Array(this.#buffer.slice(this.#buffer.byteLength - 768));
    } else if (this.#header.bpp === 1) {
      this.#palette = this.#header.palette;
    } else {
      throw new Error('Could not find 256 color palette.');
    }
  }

  #setColorFromPalette(position, index) {
    this.#pixelsData[position] = this.#palette[index * 3];
    this.#pixelsData[position + 1] = this.#palette[index * 3 + 1];
    this.#pixelsData[position + 2] = this.#palette[index * 3 + 2];
    this.#pixelsData[position + 3] = 255;
  }

  #decode4bpp() {
    this.#getPalette();

    this.#pixelsData = new Uint8Array(this.#width * this.#height * 4);
    const tmp = new Uint8Array(new ArrayBuffer(this.#width * this.#height));
    tmp.fill(0);

    let offset = 128;
    let position = 0;
    let length = 0;
    let value = 0;

    for (let y = 0; y < this.#height; ++y) {
      for (let p = 0; p < this.#header.planes; ++p) {
        position = this.#width * y;

        for (let byte = 0; byte < this.#header.bpr; ++byte) {
          if (length === 0) {
            if (this.#byteView[offset] >> 6 === 3) {
              length = this.#byteView[offset] & 63;
              value = this.#byteView[offset + 1];
              offset += 2;
            } else {
              length = 1;
              value = this.#byteView[offset++];
            }
          }

          length--;

          if (byte * 8 < this.#width) {
            for (let i = 0; i < 8; ++i) {
              const bit = (value >> (7 - i)) & 1;
              tmp[position + i] |= bit << p;

              if (p === this.#header.planes - 1) {
                this.#setColorFromPalette((position + i) * 4, tmp[position + i]);
              }
            }

            position += 8;
          }
        }
      }
    }
  }

  #decode8bpp() {
    if (this.#header.planes === 1) {
      this.#getPalette();
    }

    this.#pixelsData = new Uint8Array(new ArrayBuffer(this.#width * this.#height * 4));

    let offset = 128;
    let position = 0;
    let length = 0;
    let value = 0;

    for (let y = 0; y < this.#height; ++y) {
      for (let p = 0; p < this.#header.planes; ++p) {
        position = 4 * this.#width * y + p;

        for (let byte = 0; byte < this.#header.bpr; ++byte) {
          if (length === 0) {
            if (this.#byteView[offset] >> 6 === 3) {
              length = this.#byteView[offset] & 63;
              value = this.#byteView[offset + 1];
              offset += 2;
            } else {
              length = 1;
              value = this.#byteView[offset++];
            }
          }

          length--;

          if (byte < this.#width) {
            if (this.#header.planes === 3) {
              this.#pixelsData[position] = value;

              if (p === this.#header.planes - 1) {
                this.#pixelsData[position + 1] = 255;
              }
            } else {
              this.#setColorFromPalette(position, value);
            }

            position += 4;
          }
        }
      }
    }
  }
}
