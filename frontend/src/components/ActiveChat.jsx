import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import Message from './Message';
import Avatar from './Avatar';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;

async function uploadFileToIPFS(file) {
    const data = new FormData();
    data.append('file', file);
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { 'pinata_api_key': PINATA_API_KEY, 'pinata_secret_api_key': PINATA_API_SECRET },
        body: data,
    });
    if (!response.ok) throw new Error('Failed to upload file to Pinata');
    const result = await response.json();
    return { cid: result.IpfsHash, fileName: file.name };
}

const ActiveChat = ({ chat }) => {
    const { contract, readOnlyContract, account } = useChat();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const processLog = useCallback(async (log, eventName) => {
        const isIpfs = eventName.includes('IPFS');
        const fromName = await contract.getUser(log.args.from);
        return {
            type: isIpfs ? 'ipfs' : 'text',
            from: log.args.from,
            content: isIpfs ? log.args.ipfsCid : log.args.message,
            fileName: isIpfs ? log.args.fileName : null,
            timestamp: Number(log.args.timestamp),
            fromName: fromName || "Unknown",
        };
    }, [contract]);

    const fetchHistory = useCallback(async () => {
        if (!contract || !chat || !account) return;
        setIsLoadingHistory(true);
        try {
            const filterAndProcess = async (eventName, ...filterArgs) => {
                const filter = contract.filters[eventName](...filterArgs);
                const logs = await contract.queryFilter(filter, 0, 'latest');
                return Promise.all(logs.map(log => processLog(log, eventName)));
            };

            let processedLogs = [];
            if (chat.type === 'user') {
                const [sentText, sentIpfs, receivedText, receivedIpfs] = await Promise.all([
                    filterAndProcess('NewTextMessage', account, chat.id),
                    filterAndProcess('NewIPFSMessage', account, chat.id),
                    filterAndProcess('NewTextMessage', chat.id, account),
                    filterAndProcess('NewIPFSMessage', chat.id, account),
                ]);
                processedLogs = [...sentText, ...sentIpfs, ...receivedText, ...receivedIpfs];
            } else if (chat.type === 'group') {
                const [groupText, groupIpfs] = await Promise.all([
                    filterAndProcess('NewGroupTextMessage', null, chat.id),
                    filterAndProcess('NewGroupIPFSMessage', null, chat.id),
                ]);
                processedLogs = [...groupText, ...groupIpfs];
            }
            
            const finalMessages = processedLogs.filter(Boolean).sort((a, b) => a.timestamp - b.timestamp);
            setMessages(finalMessages);
        } catch (error) { 
            console.error("Failed to fetch message history:", error); 
        } finally { 
            setIsLoadingHistory(false); 
        }
    }, [contract, account, chat, processLog]);

    const handleNewMessageEvent = useCallback(async (log, eventName) => {
        const fromAddr = log.args.from.toLowerCase();
        const accountAddr = account.toLowerCase();
        let isRelevant = false;

        if (chat.type === 'user' && (eventName === 'NewTextMessage' || eventName === 'NewIPFSMessage')) {
            const toAddr = log.args.to.toLowerCase();
            const chatIdAddr = chat.id.toLowerCase();
            if ((fromAddr === accountAddr && toAddr === chatIdAddr) || (fromAddr === chatIdAddr && toAddr === accountAddr)) {
                isRelevant = true;
            }
        } else if (chat.type === 'group' && (eventName === 'NewGroupTextMessage' || eventName === 'NewGroupIPFSMessage')) {
            if (Number(log.args.groupId) === chat.id) {
                isRelevant = true;
            }
        }

        if (isRelevant) {
            const msgData = await processLog(log, eventName);
            if (msgData) setMessages(prev => [...prev, msgData]);
        }
    }, [account, chat, processLog]);

    useEffect(() => {
        fetchHistory();
        if (!readOnlyContract) return;
        
        const textListener = (...args) => handleNewMessageEvent({args}, 'NewTextMessage');
        const ipfsListener = (...args) => handleNewMessageEvent({args}, 'NewIPFSMessage');
        const groupTextListener = (...args) => handleNewMessageEvent({args}, 'NewGroupTextMessage');
        const groupIpfsListener = (...args) => handleNewMessageEvent({args}, 'NewGroupIPFSMessage');

        readOnlyContract.on('NewTextMessage', textListener);
        readOnlyContract.on('NewIPFSMessage', ipfsListener);
        readOnlyContract.on('NewGroupTextMessage', groupTextListener);
        readOnlyContract.on('NewGroupIPFSMessage', groupIpfsListener);

        return () => { 
            readOnlyContract.off('NewTextMessage', textListener);
            readOnlyContract.off('NewIPFSMessage', ipfsListener);
            readOnlyContract.off('NewGroupTextMessage', groupTextListener);
            readOnlyContract.off('NewGroupIPFSMessage', groupIpfsListener);
        };
    }, [readOnlyContract, fetchHistory, handleNewMessageEvent]);

    useEffect(() => {
        if (messages.length) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);
    
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !contract || isSending) return;
        setIsSending(true);
        try {
            const tx = chat.type === 'user'
                ? await contract.sendMessageText(chat.id, newMessage.trim())
                : await contract.sendGroupTextMessage(Number(chat.id), newMessage.trim());
            setNewMessage('');
            await tx.wait();
        } catch (error) { console.error("Failed to send text message:", error); 
        } finally { setIsSending(false); }
    };
    
    const handleFileSend = async (event) => {
        const file = event.target.files[0];
        if (!file || isSending) return;
        setIsSending(true);
        try {
            const { cid, fileName } = await uploadFileToIPFS(file);
            const tx = chat.type === 'user'
                ? await contract.sendMessageIPFS(chat.id, cid, fileName)
                : await contract.sendGroupIPFSMessage(Number(chat.id), cid, fileName);
            await tx.wait();
        } catch (error) { console.error("Failed to send file:", error);
        } finally {
            setIsSending(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    return (
        <>
            <header className="chat-header">
                <Avatar name={chat.name} />
                <div><h3>{chat.name}</h3></div>
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
                <input type="file" ref={fileInputRef} onChange={handleFileSend} style={{ display: 'none' }} disabled={isSending} />
                <button onClick={() => fileInputRef.current.click()} className="icon-button" title="Attach File" disabled={isSending}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="view-input" style={{flexGrow: 1, marginBottom: 0}} disabled={isSending} />
                <button onClick={handleSendMessage} className="view-button" disabled={isSending}>
                    {isSending ? 'Sending...' : 'Send'}
                </button>
            </footer>
        </>
    );
};
export default ActiveChat;