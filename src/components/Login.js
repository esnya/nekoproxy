import { AppBar } from 'material-ui';
import React, { PropTypes } from 'react';
import { LoginButton } from './LoginButton';

const Style = {
    Container: {
        textAlign: 'center',
    },
    Button: {
        margin: '16px 0 0',
    },
};

export const Login = ({
    providers,
}) => (
    <div style={Style.Container}>
        <AppBar
            showMenuIconButton={false}
            title="Login"
        />
        {
            providers.map((provider) =>
                <LoginButton
                    key={provider}
                    provider={provider}
                    style={Style.Button}
                />
            )
        }
    </div>
);
Login.propTypes = {
    providers: PropTypes.arrayOf(PropTypes.string).isRequired,
};