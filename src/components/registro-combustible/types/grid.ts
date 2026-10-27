export interface GridPosition {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

const COL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function colLetterToIndex(letter: string): number {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64);
  }
  return result;
}

function splitRangeToken(token: string): { col: string; row: number } {
  const match = token.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Token de rango inválido: ${token}`);
  }
  return { col: match[1].toUpperCase(), row: Number(match[2]) };
}

export function parseRange(range: string): GridPosition {
  const [start, end] = range.split(":");
  const startCell = splitRangeToken(start.trim());
  const endToken = end?.trim() || start.trim();
  const endCell = splitRangeToken(endToken);

  const startCol = colLetterToIndex(startCell.col);
  const endCol = colLetterToIndex(endCell.col);
  const startRow = startCell.row;
  const endRow = endCell.row;

  return {
    colStart: Math.min(startCol, endCol),
    colEnd: Math.max(startCol, endCol),
    rowStart: Math.min(startRow, endRow),
    rowEnd: Math.max(startRow, endRow),
  };
}

export function toGridColumnStyle(pos: GridPosition): string {
  return `${pos.colStart} / ${pos.colEnd + 1}`;
}

export function toGridRowStyle(pos: GridPosition): string {
  return `${pos.rowStart} / ${pos.rowEnd + 1}`;
}

export function colIndexToLetter(index: number): string {
  let n = index;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = COL_LETTERS[rem] + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}
