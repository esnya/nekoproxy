import { RaisedButton } from 'material-ui';
import React, { PropTypes } from 'react';

const Colors = {
    twitter: {
        labelColor: '#ffffff',
        backgroundColor: '#55acee',
    },
};

export const LoginButton = (props) => {
    const {
        provider,
        ...otherProps,
    } = props;

    return (
        <RaisedButton
            {...otherProps}
            {...Colors[provider]}
            linkButton
            href={`/login/${provider}`}
            label={provider}
        />
    );
};
LoginButton.propTypes = {
    provider: PropTypes.string.isRequired,
};
