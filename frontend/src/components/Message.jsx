import React from 'react';
import { useChat } from '../contexts/ChatContext';
import Avatar from './Avatar';

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
                <p style={{margin: 0}}>{msg.content}</p>
                <span className="message-timestamp">{timeString}</span>
            </div>
        </div>
    );
};

export default React.memo(Message);