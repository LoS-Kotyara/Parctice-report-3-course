import React from 'react';

import appRuntime from './appRuntime';
type Data = {
  word: string;
  suggestions: {
    word: string;
    similarity: number;
  }[];
};

let misspelledWords: Data[];

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (
    !(e.target as HTMLTextAreaElement).closest(
      'textarea, input, [contenteditable="true"]'
    )
  )
    return;

  const selectedWord = window.getSelection()?.toString();
  if (!selectedWord) return;

  const suggestions = misspelledWords
    .find((word) => word.word === selectedWord)
    ?.suggestions.map((e) => e.word);

  if (!suggestions) return;

  appRuntime.send('context-menu', { suggestions, word: selectedWord });
});

const spellcheck = (data: (Data & { isTrue: boolean })[]): Data[] => {
  return data
    .filter((word) => !word.isTrue)
    .map((word) => {
      return {
        word: word.word,
        suggestions: word.suggestions,
      };
    });
};

appRuntime.webFrame.setSpellCheckProvider('ru', {
  spellCheck(words, callback) {
    appRuntime.send('query-from-react', words);

    appRuntime.once('response-from-worker', (data) => {
      misspelledWords = spellcheck(data);
      callback(misspelledWords.map((e) => e.word));
    });
  },
});

export default () => (
  <div>
    <p>Main window</p>
    <textarea placeholder="Input..."></textarea>
  </div>
);
