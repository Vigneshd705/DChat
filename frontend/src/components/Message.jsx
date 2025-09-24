import React from 'react';
import { useChat } from '../contexts/ChatContext';
import Avatar from './Avatar';

const IPFS_GATEWAY_URL = "https://ipfs.io/ipfs/";
const isImage = (filename) => /\.(jpg|jpeg|png|gif|webp)$/i.test(filename || '');

const MessageContent = ({ msg }) => {
    if (msg.type === 'text') {
        return <p style={{margin: 0}}>{msg.content}</p>;
    }

    if (msg.type === 'ipfs') {
        const url = `${IPFS_GATEWAY_URL}${msg.content}`;
        if (isImage(msg.fileName)) {
            return (
                <a href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={msg.fileName} className="ipfs-image" />
                </a>
            );
        }
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="ipfs-file-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                <span>{msg.fileName || 'View File'}</span>
            </a>
        );
    }
    
    return <p style={{margin: 0, fontStyle: 'italic', color: '#9ca3af'}}>{msg.content || "[Unsupported message type]"}</p>;
};


const Message = ({ msg, chatPartner, chatType }) => {
    const { account } = useChat();
    const isSent = msg.from.toLowerCase() === account.toLowerCase();
    const timeString = new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const wrapperClass = isSent ? "message-wrapper message-sent" : "message-wrapper message-received";
    const bubbleClass = isSent ? "message-bubble message-bubble-sent" : "message-bubble message-bubble-received";

    return (
        <div className={wrapperClass}>
            {!isSent && (
                <div className="message-avatar">
                    <Avatar name={chatType === 'user' ? chatPartner.name : msg.fromName} />
                </div>
            )}
            <div className={bubbleClass}>
                {!isSent && chatType === 'group' && (
                     <p style={{fontWeight: 'bold', fontSize: '0.8rem', color: '#4f46e5', margin: '0 0 0.25rem 0'}}>{msg.fromName}</p>
                )}
                <MessageContent msg={msg} />
                <span className="message-timestamp">{timeString}</span>
            </div>
        </div>
    );
};

export default React.memo(Message);