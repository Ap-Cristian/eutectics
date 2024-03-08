const COLOR_DEGREE_RANGE:number = 1000;
const CellTempColorsList = [
    [0.1484375, 0.296875, 0.99609375],
    [0.24609375, 0.625, 0.99609375],
    [0.4453125, 0.84375, 0.99609375],
    [0.6640625, 0.96484375, 0.99609375],
    [0.875, 0.99609375, 0.99609375],
    [0.99609375, 0.99609375, 0.74609375],
    [0.99609375, 0.875, 0.59765625],
    [0.99609375, 0.67578125, 0.4453125],
    [0.96484375, 0.42578125, 0.3671875],
    [0.84375, 0.1484375, 0.1953125],
    [0.64453125, 0.0, 0.12890625]
]

export function getColorBasedOnTemp(temp:number) {
    // console.log(Math.ceil(temp / COLOR_DEGREE_RANGE));
    return CellTempColorsList.at(Math.abs(Math.ceil(temp / COLOR_DEGREE_RANGE)));
}