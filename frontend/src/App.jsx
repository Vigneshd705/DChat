import React from 'react';
import { useChat } from './contexts/ChatContext';
import Login from './components/Login';
import Register from './components/Register';
import ContactsPanel from './components/ContactsPanel';
import ChatWindow from './components/ChatWindow';

function App() {
    const { account, username, error } = useChat();
    const [activeChat, setActiveChat] = React.useState(null);

    if (error) {
        return <div className="app-wrapper"><div className="login-view"><p style={{color: 'red'}}>{error}</p></div></div>;
    }
    if (!account) {
        return <div className="app-wrapper"><Login /></div>;
    }
    if (!username) {
        return <div className="app-wrapper"><Register /></div>;
    }

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