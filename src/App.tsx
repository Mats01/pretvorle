import React, { FC, useCallback, useEffect, useState } from 'react';
import { SHA256 } from 'crypto-js';

import './App.css';
import Keyboard from './Keyboard';
import { styles } from './Style';
import { sveHrvRijeci } from './sveHrvRijeci';
import { useCorrectHeight, useScrollToBottom } from './hooks';
import { findTargetWord } from './utils';
import moment from 'moment';

const isAlpha = (ch: string): boolean => {
  if (ch === 'lj') return true;
  if (ch === 'nj') return true;
  return /^[A-ZŠĐŽČĆ]$/i.test(ch);
}

export const GREEN = '#6ff573';
export const YELLOW = '#f8f86c';
export const GREY = '#aaa';
const WHITE = '#fff';
const WORD_LENGTH = 4;


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
  const [startWord, setStartWord] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([...new Array(WORD_LENGTH)].fill(WHITE));
  const [previousWords, setPreviousWords] = useState<{ word: string[], colors: string[] }[]>([]);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [hideExplainer, setHideExplainer] = useState<boolean>(window.localStorage.getItem('@hideExplainer') === '4' || false);
  const [emojiText, setEmojiText] = useState<string>('');
  const [wordOfTheDay, setWordOfTheDay] = useState<string[]>([]);
  const [optimal, setOptimal] = useState<number>(0);

  const setWordPair = useCallback(() => {
    const sveHvrImenice = Object.keys(sveHrvRijeci);

    let todaysStartIndex = 0;

    let yourDate = new Date()
    todaysStartIndex = SHA256(yourDate.toISOString().split('T')[0]).words.reduce((a: number, b: number) => Math.abs(Math.abs(a) + b));
    // random number between 0 and length of array
    // todaysStartIndex = Math.floor(Math.random() * sveHvrImenice.length);

    const w = sveHvrImenice[todaysStartIndex % sveHvrImenice.length];
    const depth = 5 + todaysStartIndex % 3;
    console.log(w);
    const target = findTargetWord(w, depth, todaysStartIndex);
    console.log(target);

    console.log('optimalno, ', depth);

    setWordOfTheDay(splitCroatianWord(target.toLowerCase()));
    setStartWord(splitCroatianWord(w.toLowerCase()));
    setOptimal(depth);


  }, []);
  useEffect(() => {
    setWordPair();

  }, [setWordPair]);




  const [alertText, setAlertText] = useState<string>('');
  const showAlert = useCallback((text: string) => {
    setAlertText(text);
    setTimeout(() => {
      setAlertText('');
    }, 2000);
  }, []);




  const isAcceptedWord = useCallback((word: string[]): boolean => {
    return Object.keys(sveHrvRijeci).map(r => r.toLowerCase()).includes(word.join(""))
  }, []);

  const getEmoji = useCallback((): string => {
    <h3>Pokusaji: <strong></strong></h3>
    let emoji = `Pretvorle 🇭🇷 ${moment().format('DD.MM.YYYY')} \n${previousWords.length}`;
    emoji += `\n\n${startWord.join('')}`;

    for (const guess of previousWords) {
      let line = [];
      for (const letter of guess.colors) {
        switch (letter) {
          case GREEN:
            line.push('🟩');
            break;
          default:
            line.push('⬜️');
        }
      }
      emoji += `\n${line.sort().reverse().join('')
        } `;
    }
    emoji += `\n${'🟩'.repeat(WORD_LENGTH)} `;
    emoji += `\n${wordOfTheDay.join('')}`;

    return emoji;
  }, [previousWords])

  const checkWord = useCallback((word: string[]) => {
    let isWord = isAcceptedWord(word);
    if (!isWord) {
      showAlert('Nije u popisu riječi.');
      return;
    }
    if (previousWords.length > 0) {
      const lastWord = previousWords[previousWords.length - 1].word.join('');
      if (lastWord === word.join('')) {
        showAlert('Rijec je ista');
        return;
      }
      if (!sveHrvRijeci[lastWord].includes(word.join(''))) {
        showAlert('Promijenjeno vise od jednog slova');
        return;
      }

    }

    let newColors = colors;
    if (word.join('') === wordOfTheDay.join('')) {
      console.log('Pobijedili ste');
      setEmojiText(getEmoji());
      setShowPopup(true);
      setColors([...new Array(WORD_LENGTH)].fill(GREEN));
      return;
    } else {

      let target = [...wordOfTheDay];

      const guessed = []

      newColors = [...new Array(WORD_LENGTH)].fill(WHITE);
      for (let i = 0; i < word.length; i++) {
        if (word[i] === target[i]) {
          guessed.push(i);
          newColors[i] = GREEN;
          target[i] = '_';
        }

      }


    }


    setPreviousWords([...previousWords, { word: word, colors: newColors }]);
    setColors([...new Array(WORD_LENGTH)].fill(WHITE));
    setWord([]);

  }, [wordOfTheDay, previousWords, isAcceptedWord, showAlert, colors, getEmoji]);


  useEffect(() => {
    console.log(wordOfTheDay);
    console.log(startWord);
    startWord.length && checkWord(startWord)

  }, [wordOfTheDay, startWord]); // eslint-disable-line react-hooks/exhaustive-deps

  const acceptLetter = useCallback((key: string) => {
    if (key === 'Backspace') {
      if (word.length === 0) {
        if (previousWords.length > 1) {
          setWord(previousWords[previousWords.length - 1].word);
          setPreviousWords(previousWords.slice(0, -1));
        }
      }
      else {
        setWord(word.slice(0, -1));
      }
    }
    if (key === 'Enter') {
      word.length === WORD_LENGTH && checkWord(word);
    }
    else if (isAlpha(key)) {
      if (word.length < WORD_LENGTH) {
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


  const dismissExplainer = () => {
    if (!parseInt(window.localStorage.getItem('@hideExplainer') || '0')) {
      window.localStorage.setItem('@hideExplainer', '1');
    } else {
      let nrOfShowings = parseInt(window.localStorage.getItem('@hideExplainer') || '0');
      window.localStorage.setItem('@hideExplainer', `${nrOfShowings + 1} `);
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


      {showPopup &&
        <BravoPopup
          wordOfTheDay={wordOfTheDay.join("")}
          startWord={startWord.join("")}
          optimal={optimal}
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
        <Guesses word={wordOfTheDay} colors={[...new Array(WORD_LENGTH)].fill(GREEN)} />

        <Keyboard correct={[]} incorrect={[]} sendKeyPress={(key) => acceptLetter(key)} />
      </div>
      {!hideExplainer && <Explainer hide={dismissExplainer} />}
      {alertText && <Alert text={alertText} />}
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
    </div>
  )
}



const BravoPopup: FC<{ wordOfTheDay: string, startWord: string, emoji: string, optimal: number }> = ({ wordOfTheDay, startWord, emoji, optimal }) => {


  return (
    <div
      style={styles.bravoPopup}
    >
      <h1>Bravo!</h1>
      <p>Optimalno: <strong>{optimal}</strong></p>
      <pre
        style={styles.emojiText}
      >{emoji}</pre>

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
      <p>Zamjenom jednog po jednog slova pretrovi početnu riječ u završnu.</p>
      <p>Svaki pokušaj mora biti hrvatska riječ.</p>
      <h3>Primjer:</h3>

      <Guesses word={['m', 'a', 'n', 'a']} colors={[WHITE, GREEN, WHITE, GREEN]} />
      <Guesses word={['m', 'a', 'm', 'a']} colors={[WHITE, GREEN, WHITE, GREEN]} />
      <Guesses word={['t', 'a', 'm', 'a']} colors={[GREEN, GREEN, WHITE, GREEN]} />
      <Guesses word={['t', 'a', 't', 'a']} colors={[GREEN, GREEN, GREEN, GREEN]} />


      <button style={styles.greebButton} onClick={hide}>Kreni</button>
    </div>
  </>)
}



const Alert: FC<{ text: string }> = ({ text }) => {

  return (
    <>
      <div style={styles.alert}>
        {text}
      </div>

    </>
  )
}