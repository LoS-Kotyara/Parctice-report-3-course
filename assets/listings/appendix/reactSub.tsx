import React from 'react';

// Используем мост между процессами
import appRuntime from './appRuntime';
type Data = {
  word: string;
  suggestions: {
    word: string;
    similarity: number;
  }[];
};

// Неверно набранные слова
let misspelledWords: Data[];

// Обработчик события "Нажата правая кнопка мыши"
window.addEventListener('contextmenu', (e) => {
  // Отмена обработчика по-умолчанию
  e.preventDefault();

  // Если нажатие произошло вне редактируемого компонента
  // (textarea, input или со свойством contenteditable)
  // То прекращаем обработку события
  if (
    !(e.target as HTMLTextAreaElement).closest(
      'textarea, input, [contenteditable="true"]'
    )
  )
    return;

  // Выбранное слово для получения рекомендаций по замене
  const selectedWord = window.getSelection()?.toString();
  // Если слово не выбрано то прекращаем обработку
  if (!selectedWord) return;

  // Получаем массив предложений по замене
  const suggestions = misspelledWords
    .find((word) => word.word === selectedWord)
    ?.suggestions.map((e) => e.word);

  // И если массив пуст то предложений нет
  if (!suggestions) return;

  // Если предложения найдены, то отправляем в Electron-процесс
  // Событие, которое вызовет появление контекстного меню
  // С предложениями по замене
  appRuntime.send('context-menu',
    { suggestions, word: selectedWord });
});

// Функция, сопоставляющая словам предложения по замене
const spellcheck =
  (data: (Data & { isTrue: boolean })[]): Data[] => {
  return data
    .filter((word) => !word.isTrue)
    .map((word) => {
      return {
        word: word.word,
        suggestions: word.suggestions,
      };
    });
};

// Замена функции стандартной проверки орфографии
// Для русского языка
appRuntime.webFrame.setSpellCheckProvider('ru', {
  spellCheck(words, callback) {
    // При получении списка слов, отправляем их
    // В процесс-обработчик
    appRuntime.send('query-from-react', words);

    // Получение списка неправильно набранных
    // Слов
    appRuntime.once('response-from-worker', (data) => {
      misspelledWords = spellcheck(data);
      
      // Отображение неправильных слов с помощью 
      // Красного волнистого подчёркивания под ними
      callback(misspelledWords.map((e) => e.word));
    });
  },
});

// Основной компонент приложения, содержащий поле ввода
export default () => (
  <div>
    <p>Main window</p>
    <textarea placeholder="Input..."></textarea>
  </div>
);
