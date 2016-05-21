import {AppBar} from 'material-ui';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import React, {Component, PropTypes} from 'react';
import {LoginButton} from './LoginButton';

const muiTheme = getMuiTheme();
const Style = {
    Container: {
        textAlign: 'center',
    },
    Button: {
        margin: '16px 0 0',
    },
};

export class Login extends Component {
    static get propTypes() {
        return {
            providers: PropTypes.arrayOf(PropTypes.string).isRequired,
        };
    }

    render() {
        const {
            providers,
        } = this.props;

        return (
            <MuiThemeProvider muiTheme={muiTheme}>
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
            </MuiThemeProvider>
        );
    }
}
