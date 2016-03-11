import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Login } from '../components/Login';

const Components = {
    Login,
};

/**
 * Render static React page.
 * @param{string} component - Component name
 * @param{object} props - Properties
 * @returns{string} Rendered string
 */
export function render(component, props = {}) {
    const Component = Components[component];

    return renderToStaticMarkup(
        <Component {...props} />
    );
}
