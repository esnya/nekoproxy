import { AppBar } from 'material-ui';
import React from 'react';
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
        <AppBar title="Login" showMenuIconButton={false} />
        {
            providers.map((provider) =>
                <LoginButton
                    key={provider}
                    provider={provider}
                    style={Style.Button} />
            )
        }
    </div>
);