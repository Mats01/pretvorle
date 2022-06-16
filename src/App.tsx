import React, { FC, useCallback, useEffect, useState } from 'react';
import { SHA256 } from 'crypto-js';

import './App.css';
import Keyboard from './Keyboard';
import { styles } from './Style';
import { sveHrvRijeci } from './sveHrvRijeci';
import { sveHvrImenice } from './sveHvrImenice';
import { useCorrectHeight, useScrollToBottom } from './hooks';

const isAlpha = (ch: string): boolean => {
  if (ch === 'lj') return true;
  if (ch === 'nj') return true;
  return /^[A-ZŠĐŽČĆ]$/i.test(ch);
}

export const GREEN = '#6ff573';
export const YELLOW = '#f8f86c';
export const GREY = '#aaa';


const splitCroatianWord = (word: string): string[] => {
  let englSplit = word.split('');
  let croSplit = [];
  let i = 0;
  while (i < englSplit.length) {
    if (englSplit[i] === 'l' && englSplit[i + 1] === 'j') {
      croSplit.push('lj');
      i += 2;
      continue;
    }
    if (englSplit[i] === 'n' && englSplit[i + 1] === 'j') {
      croSplit.push('nj');
      i += 2;
      continue;
    }
    croSplit.push(englSplit[i]);
    i++;
  }
  return croSplit;
}

function App() {

  const correctHeightRef = useCorrectHeight<HTMLDivElement>();
  const guessesRef = useScrollToBottom<HTMLDivElement>();

  const [word, setWord] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>(['white', 'white', 'white', 'white', 'white']);
  const [previousWords, setPreviousWords] = useState<{ word: string[], colors: string[] }[]>([]);
  const [correct, setCorrect] = useState<string[]>([]);
  const [incorrect, setIncorrect] = useState<string[]>([]);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [randomMode,] = useState<boolean>(window.localStorage.getItem('@random') === 'true' || false);
  const [hideExplainer, setHideExplainer] = useState<boolean>(window.localStorage.getItem('@hideExplainer') === '4' || false);
  const [emojiText, setEmojiText] = useState<string>('');
  // const wordOfTheDay = ['š', 'k', 'o', 'l', 'a'];
  const [wordOfTheDay, setWordOfTheDay] = useState<string[]>([]);
  useEffect(() => {
    let todaysIndex = 0;
    if (randomMode) {
      todaysIndex = Math.floor(Math.random() * sveHvrImenice.length);
    } else {
      let yourDate = new Date()
      todaysIndex = SHA256(yourDate.toISOString().split('T')[0]).words.reduce((a: number, b: number) => Math.abs(Math.abs(a) + b))
    }
    let w = sveHvrImenice[todaysIndex % sveHvrImenice.length];
    console.log(w);
    setWordOfTheDay(splitCroatianWord(w.toLowerCase()));
  }, [randomMode]);

  // useEffect(() => {
  //   if (previousWords.length > 5) {
  //     alert('Ostali ste bez pokušaja, rijec je bila: ' + wordOfTheDay.join(''));
  //   }
  // }, [previousWords]);





  const getWiktionary = useCallback((): boolean => {
    // return fetch(`https://hr.wiktionary.org/w/api.php?action=query&titles=${word.join("")}&prop=revisions&rvprop=content&format=json&origin=*`)
    //   .then(
    //     (response) =>
    //       response.json()
    //   ).then((data) => {
    //     let pages = data.query.pages;
    //     let firstKey = Object.keys(pages)[0];
    //     if (firstKey === '-1') return false;
    //     try {
    //       return data.query.pages[Object.keys(data.query.pages)[0]].revisions[0]['*'].includes("{{hrvatski jezik}}");
    //     } catch (e) {
    //       return false;
    //     }
    //   }).catch((error) => {
    //     console.log(error);
    //     return false;
    //   })
    return sveHrvRijeci.map(r => r.toLowerCase()).includes(word.join(""))

  }, [word]);

  const getEmoji = useCallback((): string => {
    <h3>Pokusaji: <strong></strong></h3>
    let emoji = `Rjecle 🇭🇷 ${previousWords.length + 1}/6`;

    for (const guess of previousWords) {
      let line = '';
      for (const letter of guess.colors) {
        switch (letter) {
          case GREEN:
            line += '🟩';
            break;
          case YELLOW:
            line += '🟨';
            break;
          default:
            line += '⬜️';
        }
      }
      emoji += `\n${line}`;
    }
    emoji += `\n🟩🟩🟩🟩🟩`;
    return emoji;
  }, [previousWords])

  const checkWord = () => {
    let isWord = getWiktionary();
    if (!isWord) {
      alert('Nije u popisu riječi.');
      return;
    }
    let newColors = colors;
    let newCorrect = new Set<string>();
    let newIncorrect = new Set(word);
    if (word.join('') === wordOfTheDay.join('')) {
      console.log('Pobijedili ste');
      setEmojiText(getEmoji());
      setShowPopup(true);
      setColors([GREEN, GREEN, GREEN, GREEN, GREEN]);
      return;
    } else {

      let target = [...wordOfTheDay];

      const guessed = []

      newColors = [GREY, GREY, GREY, GREY, GREY];
      for (let i = 0; i < word.length; i++) {
        if (word[i] === target[i]) {
          guessed.push(i);
          newColors[i] = GREEN;
          target[i] = '_';
          newCorrect.add(word[i]);
          newIncorrect.delete(word[i]);
        }

      }
      for (let i = 0; i < word.length; i++) {
        if (guessed.indexOf(i) !== -1) continue;
        if (target.includes(word[i])) {
          newColors[i] = YELLOW;
          target[target.indexOf(word[i])] = '_';
          newCorrect.add(word[i]);
          newIncorrect.delete(word[i]);
        }
      }


    }
    if (previousWords.length >= 5) {
      alert('Ostali ste bez pokušaja, rijec je bila: ' + wordOfTheDay.join(''));
      return;
    }
    setCorrect(Array.from(new Set([...Array.from(newCorrect), ...correct])));
    setIncorrect(Array.from(new Set([...Array.from(newIncorrect), ...incorrect])));
    setPreviousWords([...previousWords, { word: word, colors: newColors }]);
    setColors(['white', 'white', 'white', 'white', 'white']);
    setWord([]);

  }

  const acceptLetter = useCallback((key: string) => {
    if (key === 'Backspace') {
      setWord(word.slice(0, -1));
    }
    if (key === 'Enter') {
      word.length === 5 && checkWord();
    }
    else if (isAlpha(key)) {
      if (word.length < 5) {
        setWord([...word, key]);
      }
    }
  }, [word]); // eslint-disable-line



  const getKeyFromPhisycalKeyboard = useCallback(
    (e: KeyboardEvent) => {
      acceptLetter(e.key);
    }, [acceptLetter])

  useEffect(() => {
    document.addEventListener('keydown', getKeyFromPhisycalKeyboard);
    return () => {
      document.removeEventListener('keydown', getKeyFromPhisycalKeyboard);
    }

  }, [word, getKeyFromPhisycalKeyboard])

  const toggleRandomMode = () => {
    if (previousWords.length > 0) {
      if (!window.confirm('Da li želite krenuti ispočetka?')) return;
    }
    window.localStorage.setItem('@random', !randomMode ? 'true' : 'false');
    window.location.reload();
  }

  const dismissExplainer = () => {
    if (!parseInt(window.localStorage.getItem('@hideExplainer') || '0')) {
      window.localStorage.setItem('@hideExplainer', '1');
    } else {
      let nrOfShowings = parseInt(window.localStorage.getItem('@hideExplainer') || '0');
      window.localStorage.setItem('@hideExplainer', `${nrOfShowings + 1}`);
    }
    setHideExplainer(true);
  }

  return (
    <div ref={correctHeightRef} className="App" style={styles.app}>
      <div
        style={styles.betaBanner}
      >
        <div style={styles.betaText}>BETA</div>
      </div>

      <div
        style={styles.randomSwitch}
        onClick={toggleRandomMode}
      >
        <span
          style={!randomMode ? { textDecoration: 'underline' } : { color: "#666" }}
        >ranked
        </span> | <span
          style={randomMode ? { textDecoration: 'underline' } : { color: "#666" }}
        >random
        </span>
      </div>
      {showPopup &&
        <BravoPopup
          wordOfTheDay={wordOfTheDay.join("")}
          guesses={previousWords.map(p => p.word.join(""))}
          emoji={emojiText}
        />
      }
      <div style={styles.mainflexWrapper}>
        <h1>Pretvorle</h1>
        <div
          ref={guessesRef}
          style={styles.guessesWrapper}
        >
          {previousWords.map((guess, index) => (
            <Guesses word={guess.word} colors={guess.colors} key={index.toString()} />
          ))}
          <Guesses word={word} colors={colors} />
        </div>
        <Keyboard correct={correct} incorrect={incorrect} sendKeyPress={(key) => acceptLetter(key)} />
      </div>
      {!hideExplainer && <Explainer hide={dismissExplainer} />}
    </div >
  );
}

export default App;


const Guesses: FC<{ word: string[], colors: string[] }> = ({ word, colors }) => {

  return (
    <div
      style={styles.wrapper}
    >
      <div
        style={{
          ...styles.container,
          backgroundColor: colors[0]
        }}
      >
        {word[0]}
      </div>
      <div
        style={{
          ...styles.container,
          backgroundColor: colors[1]
        }}
      >
        {word[1]}
      </div>
      <div
        style={{
          ...styles.container,
          backgroundColor: colors[2]
        }}
      >
        {word[2]}
      </div>
      <div
        style={{
          ...styles.container,
          backgroundColor: colors[3]
        }}
      >
        {word[3]}
      </div>
      <div
        style={{
          ...styles.container,
          backgroundColor: colors[4]
        }}
      >
        {word[4]}
      </div>
    </div>
  )
}



const BravoPopup: FC<{ wordOfTheDay: string, guesses: string[], emoji: string }> = ({ wordOfTheDay, guesses, emoji }) => {


  return (
    <div
      style={styles.bravoPopup}
    >
      <h1>Bravo!</h1>
      <h3>Pokusaji: <strong>{guesses.length + 1}/6</strong></h3>
      <h1>{wordOfTheDay}</h1>
      <pre>{emoji}</pre>
      <button
        style={styles.greebButton}
        onClick={() => {
          // set clipboard content to emoji
          navigator.clipboard.writeText(emoji);
        }}
      >Podijeli</button>

    </div>
  )
}

const Explainer: FC<{ hide: () => void }> = ({ hide }) => {

  return (<>
    <div style={styles.explanerWindow}>
      <h1>Pretvorle</h1>
      <p>Pogodi novu riječ svaki dan u 6 pokušaja.</p>
      <p>Svaki pokušaj mora biti hrvatska riječ.</p>
      <p>Nakon svakog pokušaja otkriva se koja slova su pogođena.</p>
      <h3>Primjeri:</h3>

      <Guesses word={['o', 'k', 'o', 'l', 'o']} colors={[GREY, YELLOW, GREY, GREY, GREY]} />
      <p>Tražena riječ sadrži slovo 'k' na nakom drugom mjestu.</p>

      <Guesses word={['r', 'u', 'k', 'a', 'v']} colors={[GREEN, GREY, GREY, GREY, GREY]} />
      <p>Tražena riječ sadrži slovo 'r' na prvom mjestu.</p>

      <button style={styles.greebButton} onClick={hide}>Kreni</button>
    </div>
  </>)
}