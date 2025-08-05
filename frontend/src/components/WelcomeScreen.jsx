import React from 'react';

const WelcomeScreen = () => {
    return (
        <div className="placeholder-screen">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2>Select a chat to start messaging</h2>
            <p>Your messages are end-to-end decentralized.</p>
        </div>
    );
};

export default WelcomeScreen;