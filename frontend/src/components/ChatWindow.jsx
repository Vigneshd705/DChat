import React from 'react';
import WelcomeScreen from './WelcomeScreen';
import ActiveChat from './ActiveChat';

const ChatWindow = ({ activeChat }) => {
    return (
        <section className="chat-window">
            {!activeChat ? (
                <WelcomeScreen />
            ) : (
                <ActiveChat key={activeChat.id} chat={activeChat} />
            )}
        </section>
    );
};

export default ChatWindow;