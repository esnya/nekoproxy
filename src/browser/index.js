import React from 'react';
import { render } from 'react-dom';
import { Login } from '../components/Login';

const BrowserData = JSON.parse(document.body.getAttribute('data-browser'));

render(
    <Login {...BrowserData} />,
    document.getElementById('app')
);