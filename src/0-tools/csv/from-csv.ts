import { DEFAUL_CONFIG } from '../../reports-on-repo/0-config/config';

export function fromCsv(header: string, lines: string[]) {
    const columns = header.split(DEFAUL_CONFIG.CSV_SEP);
    return lines.map((line, i) => {
        const cells = line.split(DEFAUL_CONFIG.CSV_SEP);
        if (columns.length !== cells.length) {
            throw new Error(
                `The number of cells in line number ${i} ("${line}" is not the same as the number of columns specified in the header "${header})"`,
            );
        }
        return cells.reduce((obj, cell, i) => {
            obj[columns[i].trim()] = cell;
            return obj;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, {} as any);
    });
}
