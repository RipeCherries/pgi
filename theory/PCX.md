# Описание формата PCX

**PCX (PCExchange)** — стандарт представления графической информации, разработанный компанией ZSoft Corporation.

## Структура заголовка PCX

Все версии файлов PCX имеют заголовок одинаковой структуры длиной **128 байт**.
Это справедливо как для полноэкранных изображений, так и для небольших рисунков.

При описании типов данных можно встретить **два числовых типа**:

1. `BYTE` — 8-битное беззнаковое целое.
2. `WORD` — 16-битное беззнаковое целое.

```cpp
typedef struct _PcxHeader {
  BYTE  Identifier;
  BYTE  Version;
  BYTE  Encoding;
  BYTE  BitsPerPixel;
  WORD  XStart;
  WORD  YStart;
  WORD  XEnd;
  WORD  YEnd;
  WORD  HorzRes;
  WORD  VertRes;
  BYTE  Palette[48];
  BYTE  Reserved1;
  BYTE  NumBitPlanes;
  WORD  BytesPerLine;
  WORD  PaletteType;
  BYTE  Reserved2[58];
} PCXHEAD;
```

1. `Identifier` — Байт идентификации, для файлов PCX равен #0A;
2. `Version` — Версия файла PCX: 0=v2.5; 2=v2.8 с опис. палитры; 3=v2.8 без опис. палитры; 5=v3.0;
3. `Encoding` — Ключ уплотнения данных: 0 = без уплотнения; 1 = уплотнение методом RLE;
4. `BitsPerPixel` — Количество бит на пиксель;
5. `XStart` — Левая координата изображения;
6. `YStart` — Верхняя координата изображения;
7. `XEnd` — Правая координата изображения;
8. `YEnd` — Нижняя координата изображения;
9. `HorzRes` — Разрешение по горизонтали, dpi;
10. `VertRes` — Разрешение по вертикали, dpi;
11. `Palette` — Описание палитры;
12. `Reserved1` — Зарезервировано;
13. `NumBitPlanes` — Число битовых плоскостей, до 4;
14. `BytesPerLine` — Число байт на строку изображения;
15. `PaletteType` — Параметры палитры: 1 = ч/б; 2 = уровни серого;
16. `Reserved2` — Пустые (для заполнения до 128).

**Расположение в файле:**

| Позиция (HEX) | Размер (байты) |     Имя      |
|:-------------:|:--------------:|:------------:|
|      00       |       1        |  Identifier  |
|      01       |       1        |   Version    |
|      02       |       1        |   Encoding   |
|      03       |       1        | BitsPerPixel |
|      04       |       2        |    XStart    |
|      06       |       2        |    YStart    |
|      08       |       2        |     XEnd     |
|      0A       |       2        |     YEnd     |
|      0C       |       2        |   HorzRes    |
|      0E       |       2        |   VertRes    |
|      0F       |       48       |   Palette    |
|      40       |       1        |  Reserved1   |
|      41       |       1        | NumBitPlanes |
|      42       |       2        | BytesPerLine |
|      44       |       2        | PaletteType  |
|      46       |       58       |  Reserved2   |

## Кодирование графических данных

Вслед за заголовком файла PCX располагаются графические данные самого рисунка.

Каждый рисунок считывается построчно и разделяется на **битовые плоскости**:

* красный;
* зеленый;
* синий;
* интенсивность.

Затем соответственно биты первой строки соединяются в пары байтов, образуя плоскость красного
цвета. Незагруженные биты в последней паре байтов дополняются нулями. После этого следует
первая строка плоскости зеленого цвета, плоскости синего цвета и строки битовой плоскости интенсивности.
Процесс повторяется до тех пор, пока не будут введены все строки изображения.

**Способ кодировки RLE** предполагает выделение последовательности одинаковых битов
с сохранением количества их повторений и шаблона заполнения. В файле кодированные
данные представлены следующим образом:

1. Если оба старших бита (6,7) байта заполнены единицами, то последующая информация
   находится в уплотненной форме. В этом случае биты 0-5 указывают необходимое количество
   повторов цепочки битов, занесенных в следующий байт.
2. Если оба старших бита первого байта содержат нули, то данный байт следует трактовать именно как байт данных.
   Уплотнение методом RLE позволяет в двух байтах кодировать до 63 повторяющихся байт, или 504 бита.
   Чтобы различать байты-маркеры уплотнения RLE, байты данных со значениями 0xC0 и более нельзя непосредственно
   вводить в файл. В этом случае обязательно используется пара байтов. В результате, кодированные файлы PCX
   теоретически могут стать более длинными, чем при неуплотненном запоминании графических данных.
   Если такая ситуация возникнет, тогда данные записываются неуплотненными.