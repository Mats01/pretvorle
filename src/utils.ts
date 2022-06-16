import { sveHrvRijeci } from "./sveHrvRijeci";



export const findTargetWord = (start: string, distance: number, path: string[]): string[] => {

  // console.log(start, path);

  let next = sveHrvRijeci[start];
  // console.log(start, next);
  if (path.length === distance) return path;
  // console.log(next);
  if (!next) return [];
  for (const word of next) {
    if (!path.includes(word)) {
      path.push(word);
      const found = findTargetWord(word, distance, path);
      if (found.length === distance) return found;
      path.pop();
    }
  }
  return path;
}