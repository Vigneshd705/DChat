import React from 'react';
import { useChat } from './contexts/ChatContext';
import Login from './components/Login';
import Register from './components/Register';
import ContactsPanel from './components/ContactsPanel';
import ChatWindow from './components/ChatWindow';

function App() {
    const { account, username, error } = useChat();
    const [activeChat, setActiveChat] = React.useState(null);

    // Render loading or error states
    if (error) {
        return <div className="app-wrapper"><p style={{color: 'red'}}>{error}</p></div>;
    }
    if (!account) {
        return <div className="app-wrapper"><Login /></div>;
    }
    if (!username) {
        return <div className="app-wrapper"><Register /></div>;
    }

    // Render the main chat application
    return (
        <div className="app-wrapper">
            <main className="app-container">
                <ContactsPanel onSelectChat={setActiveChat} activeChat={activeChat} />
                <ChatWindow activeChat={activeChat} />
            </main>
        </div>
    );
}

export default App;