import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import Message from './Message';
import Avatar from './Avatar';

const ActiveChat = ({ chat }) => {
    // We use both contract instances: one for writing (with signer) and one for reading (websocket)
    const { contract, readOnlyContract, account } = useChat();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchHistory = useCallback(async () => {
        // Ensure we have everything we need before fetching
        if (!contract || !chat || !account) return;

        setIsLoadingHistory(true);
        console.log(`%cFetching chat history with: ${chat.name} (${chat.id})`, "color: blue; font-weight: bold;");
        console.log(`Your account: ${account}`);

        try {
            // Create filters for both directions of the conversation
            const sentFilter = contract.filters.NewMessage(account, chat.id);
            const receivedFilter = contract.filters.NewMessage(chat.id, account);

            // Query the blockchain for past events in parallel
            const [sentLogs, receivedLogs] = await Promise.all([
                contract.queryFilter(sentFilter, 0, 'latest'),
                contract.queryFilter(receivedFilter, 0, 'latest')
            ]);
            
            console.log(`Found ${sentLogs.length} sent messages and ${receivedLogs.length} received messages.`);

            const allLogs = [...sentLogs, ...receivedLogs];

            // Sort all found messages by their timestamp to ensure correct chronological order
            allLogs.sort((a, b) => Number(a.args.timestamp) - Number(b.args.timestamp));

            const historicalMessages = await Promise.all(
                allLogs.map(async (log) => {
                    const fromName = await contract.getUser(log.args.from);
                    return {
                        from: log.args.from,
                        to: log.args.to,
                        content: log.args.message,
                        timestamp: Number(log.args.timestamp),
                        fromName: fromName || "Unknown",
                    };
                })
            );
            
            setMessages(historicalMessages);
            console.log("Successfully processed and set historical messages.", historicalMessages);

        } catch (error) {
            console.error("Failed to fetch message history:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [contract, account, chat]);

    // This handler is for REAL-TIME messages via WebSocket
    const handleNewMessage = useCallback(async (from, to, content, timestamp) => {
        const fromAddr = from.toLowerCase();
        const toAddr = to.toLowerCase();
        const accountAddr = account.toLowerCase();
        const chatIdAddr = chat.id.toLowerCase();

        if ((fromAddr === accountAddr && toAddr === chatIdAddr) || (fromAddr === chatIdAddr && toAddr === accountAddr)) {
            const fromName = await contract.getUser(from);
            const msgData = { from, to, content, timestamp: Number(timestamp), fromName };
            setMessages(prev => [...prev, msgData]);
        }
    }, [account, chat.id, contract]);

    // Effect to fetch history and set up real-time listener
    useEffect(() => {
        fetchHistory();
        if (!readOnlyContract) return;

        readOnlyContract.on('NewMessage', handleNewMessage);
        return () => { readOnlyContract.off('NewMessage', handleNewMessage); };
    }, [readOnlyContract, fetchHistory, handleNewMessage]);

    // Auto-scroll effect
    useEffect(() => {
        if(messages.length) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);
    
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !contract) return;
        try {
            const tx = await contract.sendMessage(chat.id, newMessage.trim());
            setNewMessage('');
            await tx.wait();
        } catch (error) { console.error("Failed to send message:", error); }
    };
    
    return (
        <>
            <header className="chat-header">
                <Avatar name={chat.name} />
                <div><h3>{chat.name}</h3></div>
            </header>
            <div className="messages-container">
                {isLoadingHistory ? (
                     <div className="placeholder-screen"><h2>Loading Chat History...</h2></div>
                ) : messages.length > 0 ? (
                    messages.map((msg, index) => (
                        <Message key={`${msg.timestamp}-${index}`} msg={msg} chatPartner={chat} />
                    ))
                ) : (
                    <div className="placeholder-screen"><h2>No messages yet. Say hello!</h2></div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <footer className="chat-footer">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="view-input" style={{flexGrow: 1, marginBottom: 0}} />
                <button onClick={handleSendMessage} className="view-button">Send</button>
            </footer>
        </>
    );
};

export default ActiveChat;