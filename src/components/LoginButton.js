import { RaisedButton } from 'material-ui';
import React from 'react';

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
    return <RaisedButton
            {...otherProps}
            {...Colors[provider]}
            href={`/login/${provider}`}
            label={provider}
            linkButton={true} />;
};