import React from 'react';
import { useChat } from '../contexts/ChatContext';

const Login = () => {
    const { connectWallet } = useChat();
    return (
        <div className="login-view">
            <h1 className="view-title">Welcome to D-Chat</h1>
            <p className="view-subtitle">A truly decentralized chat experience on the blockchain.</p>
            <button onClick={connectWallet} className="view-button">
                Connect Wallet
            </button>
        </div>
    );
};

export default Login;