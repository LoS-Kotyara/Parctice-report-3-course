import React, { Fragment } from 'react';
import { render } from 'react-dom';

import './app.global.css';

// Использование оптимизированного компонента
// Для подключения к DOM
const AppContainer = Fragment;

// Когда DOM загрузился
document.addEventListener('DOMContentLoaded', () => {
  // Подключаем React-приложение к элементу с id
  // Равным "root"
  const Root = require('./containers/Root').default;
  render(
    <AppContainer>
      <Root />
    </AppContainer>,
    document.getElementById('root')
  );
});
