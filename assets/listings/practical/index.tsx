import React, { Fragment } from 'react';
import { render } from 'react-dom';

import './app.global.css';

const AppContainer = Fragment;

document.addEventListener('DOMContentLoaded', () => {
  const Root = require('./containers/Root').default;
  render(
    <AppContainer>
      <Root />
    </AppContainer>,
    document.getElementById('root')
  );
});
