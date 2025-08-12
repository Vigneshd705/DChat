import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import Message from './Message';
import Avatar from './Avatar';

const ActiveChat = ({ chat }) => {
    const { contract, readOnlyContract, account } = useChat();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchHistory = useCallback(async () => {
        if (!contract || !chat || !account) return;
        setIsLoadingHistory(true);
        try {
            let allLogs = [];
            if (chat.type === 'user') {
                const sentFilter = contract.filters.NewMessage(account, chat.id);
                const receivedFilter = contract.filters.NewMessage(chat.id, account);
                const [sentLogs, receivedLogs] = await Promise.all([
                    contract.queryFilter(sentFilter, 0, 'latest'),
                    contract.queryFilter(receivedFilter, 0, 'latest')
                ]);
                allLogs = [...sentLogs, ...receivedLogs];
                allLogs.sort((a, b) => Number(a.args.timestamp) - Number(b.args.timestamp));
            } else if (chat.type === 'group') {
                const groupFilter = contract.filters.NewGroupMessage(null, chat.id);
                allLogs = await contract.queryFilter(groupFilter, 0, 'latest');
            }

            const historicalMessages = await Promise.all(allLogs.map(async (log) => ({
                from: log.args.from,
                to: chat.type === 'user' ? log.args.to : null,
                groupId: chat.type === 'group' ? Number(log.args.groupId) : null,
                content: log.args.message,
                timestamp: Number(log.args.timestamp),
                fromName: await contract.getUser(log.args.from) || "Unknown",
            })));
            setMessages(historicalMessages);

        } catch (error) { console.error("Failed to fetch message history:", error);
        } finally { setIsLoadingHistory(false); }
    }, [contract, account, chat]);

    const handleNewUserMessage = useCallback(async (from, to, content, timestamp) => {
        if (chat.type !== 'user') return;
        const fromAddr = from.toLowerCase();
        const toAddr = to.toLowerCase();
        const accountAddr = account.toLowerCase();
        const chatIdAddr = chat.id.toLowerCase();

        if ((fromAddr === accountAddr && toAddr === chatIdAddr) || (fromAddr === chatIdAddr && toAddr === accountAddr)) {
            const fromName = await contract.getUser(from);
            const msgData = { from, to, content, timestamp: Number(timestamp), fromName };
            setMessages(prev => [...prev, msgData]);
        }
    }, [account, chat, contract]);

    const handleNewGroupMessage = useCallback(async (from, groupId, content, timestamp) => {
        if (chat.type !== 'group' || Number(groupId) !== chat.id) return;
        const fromName = await contract.getUser(from);
        const msgData = { from, groupId: Number(groupId), content, timestamp: Number(timestamp), fromName };
        setMessages(prev => [...prev, msgData]);
    }, [chat, contract]);


    useEffect(() => {
        fetchHistory();
        if (!readOnlyContract) return;
        readOnlyContract.on('NewMessage', handleNewUserMessage);
        readOnlyContract.on('NewGroupMessage', handleNewGroupMessage);
        return () => { 
            readOnlyContract.off('NewMessage', handleNewUserMessage);
            readOnlyContract.off('NewGroupMessage', handleNewGroupMessage);
        };
    }, [readOnlyContract, fetchHistory, handleNewUserMessage, handleNewGroupMessage]);

    useEffect(() => {
        if(messages.length) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);
    
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !contract) return;
        try {
            const tx = chat.type === 'user'
                ? await contract.sendMessage(chat.id, newMessage.trim())
                : await contract.sendGroupMessage(Number(chat.id), newMessage.trim());
            setNewMessage('');
            await tx.wait();
        } catch (error) { console.error("Failed to send message:", error); }
    };
    
    return (
        <>
            <header className="chat-header">
                <Avatar name={chat.name} />
                <div>
                    <h3>{chat.name}</h3>
                </div>
            </header>
            <div className="messages-container">
                {isLoadingHistory ? (
                    <div className="placeholder-screen"><h2>Loading History...</h2></div>
                ) : messages.length > 0 ? (
                    messages.map((msg, index) => (
                        <Message key={`${msg.timestamp}-${index}`} msg={msg} chatPartner={chat} chatType={chat.type} />
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