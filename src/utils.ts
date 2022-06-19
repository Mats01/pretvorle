import { sveHrvRijeci } from "./sveHrvRijeci";


export const findTargetWord = (start: string, distance: number, todaysIndex: number): string => {

  const q: string[] = [];
  const visited: string[] = [];
  const prev: { [word: string]: number } = {};

  q.push(start);

  while (q.length > 0) {
    const current = q.shift()!;
    const next = sveHrvRijeci[current];
    if (prev[current] && prev[current] === distance - 1) {
      return next[todaysIndex % next.length];
    }
    for (const word of next) {
      if (!visited.includes(word)) {
        visited.push(word);
        q.push(word);
        prev[word] = (prev[current] || 0) + 1;

      }
    }
  }
  return '';
}