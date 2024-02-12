# Описание формата BMP

**BMP (Bitmap Picture)** — формат хранения растровых изображений, разработанный компанией Microsoft.

## Структуры формата

Формат **BMP** представляет собой несжатое (в основном) изображение, которое довольно легко читается
и выводится в ОС Windows, в которой есть специальные функции API, которые в этом помогают.

<p align="center">
    <img src="https://jenyay.net/uploads/Programming/Bmp/struct.gif" width="200" alt="Структура BMP файла" />
</p>

При описании типов данных можно встретить **четыре числовых типа**:

1. `BYTE` — 8-битное беззнаковое целое.
2. `WORD` — 16-битное беззнаковое целое.
3. `DWORD` — 32-битное беззнаковое целое.
4. `LONG` — 32-битное беззнаковое целое.

## 1. BITMAPFILEHEADER

В начале стоит заголовок файла **(BITMAPFILEHEADER — 14-байтная структура, которая располагается
в самом начале файла)**. Он описан следующим образом:

```cpp
typedef struct BITMAPFILEHEADER {
    WORD    bfType;
    DWORD   bfSize;
    WORD    bfReserved1;
    WORD    bfReserved2;
    DWORD   bfOffBits;
}
```

1. `bfType` — Отметка для отличия формата от других (сигнатура формата). Стандартно "BM".
2. `bfSize` — Размер файла в байтах.
3. `bfReserved1 / bfReserved2` — Зарезервированы и должны содержать ноль.
4. `bfOffBits` — Положение пиксельных данных относительно начала данной структуры (в байтах).

**Расположение в файле:**

| Позиция (HEX) | Размер (байты) |     Имя     |
|:-------------:|:--------------:|:-----------:|
|      00       |       2        |   bfType    |
|      02       |       4        |   bfSize    |
|      06       |       2        | bfReserved1 |
|      08       |       2        | bfReserved2 |
|      0A       |       4        |  bfOffBits  |

## 2. BITMAPINFOHEADER

**BITMAPINFOHEADER** в файле идёт сразу за BITMAPFILEHEADER.
Данная структура является основной и описательной в формате BMP.
Блок BITMAPINFOHEADER состоит из **трёх частей**:

1. Структура с информационными полями.
2. Битовые маски для извлечения значений цветовых каналов (присутствуют не всегда).
3. Таблица цветов (присутствует не всегда).

### 2.1. Информационные поля

Информационные поля описаны следующим образом:

```cpp
typedef struct BITMAPINFOHEADER {
    DWORD   biSize;
    LONG    biWidth;
    LONG    biHeight;
    WORD    biPlanes;
    WORD    biBitCount;
    DWORD   biCompression;
    DWORD   biSizeImage;
    LONG    biXPelsPerMeter;
    LONG    biYPelsPerMeter;
    DWORD   biClrUsed;
    DWORD   biClrImportant;
}
```

1. `biSize` — Размер структуры в байтах, указывающий также на версию структуры.
2. `biWidth` — Ширина растра в пикселях. Указывается целым числом со знаком.
3. `biHeight` — Целое число со знаком, содержащее два параметра: высота растра в пикселях
   (абсолютное значение числа) и порядок следования строк в двумерных массивах (знак числа).
4. `biPlanes` — Количество плоскостей. В BMP всегда устанавливается в 1.
5. `biBitCount` — Количество бит на пиксель.
6. `biCompression` — Указывает на способ хранения пикселей.
7. `biSizeImage` — Размер пиксельных данных в байтах.
   Может быть обнулено, если хранение осуществляется двумерным массивом (без сжатия).
8. `biXPelsPerMeter / biYPelsPerMeter` — Количество пикселей на метр по горизонтали и вертикали (разрешение).
9. `biClrUsed` — Размер таблицы цветов в ячейках.
10. `biClsImportant` — Количество ячеек от начала таблицы цветов до последней используемой (включая).

**Расположение в файле:**

| Позиция (HEX) | Размер (байты) |       Имя       |
|:-------------:|:--------------:|:---------------:|
|      0E       |       4        |     biSize      |
|      12       |       4        |     biWidth     |
|      16       |       4        |    biHeight     |
|      1A       |       2        |    biPlanes     |
|      1C       |       2        |   biBitCount    |
|      1E       |       4        |  biCompression  |
|      22       |       4        |   biSizeImage   |
|      26       |       4        | biXPelsPerMeter |
|      2A       |       4        | biYPelsPerMeter |
|      2E       |       4        |    biClsUsed    |
|      32       |       4        | biClsImportant  |

**Битность изображения (поле biBitCount):**

Все разновидности формата bmp условно можно разделить на **два типа**:

* палитровые;
* беспалитровые.

Палитра может быть даже в беспалитровых форматах, только там она не используется.
В беспалитровых bmp цвет высчитывается прямо из тех битов, которые идут в файле, начиная с некоторого места.
А в палитровых каждый байт описывает один или несколько пикселей,
причем значения байта (или битов) — это индекс цвета в палитре.

| biBitCount |    Формат     | Количество цветов (максимальное) | Примечания                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|:----------:|:-------------:|:--------------------------------:|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|     1      |  Палитровый   |                2                 | Двухцветная картинка. Если бит растра сброшен (0), то это значит, что на этом месте должен быть первый цвет из палитры, а если установлен (1), то второй.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|     4      |  Палитровый   |                16                | Каждый байт описывает 2 пикселя. Если первый байт в картинке 0x1F, то он соответствует двум пикселям, цвет первого - второй цвет из палитры (потому что отсчет идет от нуля), а второй пиксель - 16-й цвет палитры.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
|     8      |  Палитровый   |               256                | Палитра занимает один килобайт. Один байт - это один цвет. Причем его значение - это номер цвета в палитре.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
|     16     | Беспалитровый |           2¹⁵ или 2¹⁶            | Это самый запутанный вариант. Начнем с того, что он беспалитровый, то есть каждые два байта (одно слово WORD) в растре однозначно определяют один пиксель. Но вот что получается: битов-то 16, а компонентов цветов - 3 (Красный, Зеленый, Синий). А 16 никак на 3 делиться не хочет. Поэтому здесь есть два варианта. Первый - использовать не 16, а 15 битов, тогда на каждую компоненту цвета выходит по 5 бит. Таким образом мы можем использовать максимум 2^15 = 32768 цветов и получается тройка R-G-B = 5-5-5. Но тогда за зря теряется целый бит из 16. Но так уж случилось, что наши глаза среди всех цветов лучше воспринимают зеленый цвет, поэтому и решили этот один бит отдавать на зеленую компоненту, то есть тогда получается тройка R-G-B = 5-6-5, и теперь мы может использовать 2^16 = 65536 цветов. Но что самое неприятное, что используют оба варианта. В MSDN предлагают для того, чтобы различать сколько же цветов используется, заполнять этим значением поле biClrUsed из структуры BITMAPINFOHEADER. Чтобы выделить каждую компоненту надо использовать следующие маски. Для формата 5-5-5: 0x001F для синей компоненты, 0x03E0 для зеленой и 0x7C00 для красной. Для формата 5-6-5: 0x001F - синяя, 0x07E0 - зеленая и 0xF800 красная компоненты соответственно. |
|     24     | Беспалитровый |               2²⁴                | Здесь 3 байта определяют 3 компоненты цвета. То есть по компоненте на байт. Просто читаем по структуре RGBTRIPLE и используем его поля rgbtBlue, rgbtGreen, rgbtRed. Они идут именно в таком порядке.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|     32     | Беспалитровый |               2³²                | Здесь 4 байта определяют 3 компоненты. Но, правда, один байт не используется. Его можно отдать, например, для альфа-канала (прозрачности). Читать растр в данном случае удобно структурами RGBQUAD.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

**Поле Compression:**

| Значение |   Имя константы   |                 Хранение пикселей                  |
|:--------:|:-----------------:|:--------------------------------------------------:|
|    0     |      BL_RGB       |                  Двумерный массив                  |
|    1     |      BL_RLE8      |                  RLE кодирование                   |
|    2     |      BL_RLE4      |                  RLE кодирование                   |
|    3     |   BI_BITFIELDS    |    двумерный массив с масками цветовых каналов     |
|    4     |      BI_JPEG      |              во встроенном JPEG-файле              |
|    5     |      BI_PNG       |              во встроенном PNG-файле               |
|    6     | BI_ALPHABITFIELDS | двумерный массив с масками цветовых и альфа-канала |

### 2.3. Таблица цветов

Таблица цветов является частью блока BITMAPINFO и может использоваться в **двух случаях**:

1. Она обязательно присутствует при битностях 8 и ниже,
   в которых цвет пикселей задаётся индексом ячейки из неё.
2. При битностях 8 и выше, в которых цвет указывается непосредственным значением,
   таблица присутствует если используется заголовок не CORE-версии,
   у которого поле ClrUsed содержит ненулевое значение.
   Здесь она задействуется уже для оптимизации цветов при работе с использующими палитры устройствами.

Позиция таблицы цветов указывается от его начала блока BITMAPINFO.
По умолчанию она идёт сразу за информационной структурой.
Но между структурой с полями и цветовой таблицей могут идти четырёхбайтные битовые маски
для извлечения цветовых каналов (касается только битностей 16 и 32).
Они там находятся только если используется информационная структура 3-й версии (Size = 40)
и поле Compression содержит 3 (BI_BITFIELDS) или 6 (BI_ALPHABITFIELDS).
Тогда к размеру информационных полей нужно прибавить 12 (при значении BI_BITFIELDS)
или 16 байт (если указано BI_ALPHABITFIELDS). Получается 6 вариантов расположения таблицы:

| Версия заголовка | Позиция В BITMAPINFO (HEX) | Примечания                                   |
|:----------------:|:--------------------------:|:---------------------------------------------|
|       CORE       |             0C             | Маски каналов не поддерживаются              |
|        3         |             28             | Compression не содержит 3 или 6              |
|        3         |             34             | Compression = 3                              |
|        3         |             38             | Compression = 6                              |
|        4         |             6C             | Маски каналов встроены в информационные поля |
|        5         |             7B             | Маски каналов встроены в информационные поля |

Сама же таблица представляет собой одномерный массив, который может содержать ячейки трёх типов:

1. 32-битная структура RGBQUAD. Применяется если в BITMAPINFO использована информационная структура версии 3, 4 или 5.
   В самой же структуре RGBQUAD указывается цвет в модели RGB в четырёх байтовых ячейках
   (все имеют WinAPI-тип BYTE): rgbBlue (синий), rgbGreen (зелёный), rgbRed (красный)
   и rgbReserved (зарезервирована и должна быть обнулена).
2. 24-битная структура RGBTRIPLE. Применяется, если в BITMAPINFO начинается со структуры BITMAPCOREHEADER.
   RGBTRIPLE состоит из трёх байтовых ячеек (WinAPI-тип BYTE), в которых указывается цвет в модели RGB:
   rgbtBlue (синий), rgbtGreen (зелёный) и rgbtRed (красный).
3. 16-битные индексы цветов (беззнаковые целые числа) в текущей логической палитре контекста устройства.
   Этот вид доступен только во время выполнения приложения. Формат BMP не поддерживает явное указание,
   что используется такая таблица и поэтому само приложение извещает WIN-API функции об этом в специальных параметрах.

## 3. Пиксельные данные (двумерный массив)

В двумерном массиве можно хранить пиксели любой битности.
В данной компоновке пиксели растра записываются однопиксельными горизонтальными полосками, которые Microsoft в своей документации часто называет _«scans»_ (в русском языке наиболее близкое слово: строки). В памяти эти ряды записываются по-порядку, но при положительном Height: начиная с самого нижнего, а при отрицательном: с самого верхнего). Внутри каждого горизонтального ряда пиксели записываются строго только от левого к правому.
**Ряды, независимо от размера ячеек, обязательно должны дополняться нулями до кратного четырём байтам размера**

