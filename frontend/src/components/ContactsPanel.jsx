import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import Modal from './Modal';
import Avatar from './Avatar';
import { ethers } from 'ethers';

const ContactsPanel = ({ onSelectChat, activeChat }) => {
    const { contract, account, username } = useChat();
    const [contacts, setContacts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [friendAddress, setFriendAddress] = useState('');
    const [error, setError] = useState('');

    const fetchContacts = useCallback(async () => {
        if (!contract || !account) return;
        try {
            const friendAddresses = await contract.getFriendList(account);
            const friends = await Promise.all(friendAddresses.map(async (address) => ({
                type: 'user', id: address, name: await contract.getUser(address) || 'Unnamed'
            })));
            setContacts(friends);
        } catch(err) { console.error("Could not fetch contacts:", err); }
    }, [contract, account]);

    useEffect(() => {
        if(contract) {
            fetchContacts();
            const onFriendAdded = (user1, user2) => {
                if (user1.toLowerCase() === account.toLowerCase() || user2.toLowerCase() === account.toLowerCase()) {
                    fetchContacts();
                }
            };
            contract.on('FriendAdded', onFriendAdded);
            return () => contract.off('FriendAdded', onFriendAdded);
        }
    }, [contract, account, fetchContacts]);

    const handleAddFriend = async () => {
        setError('');
        const input = friendAddress.trim();
        if (!input) return setError("Input cannot be empty.");
        try {
            let tx;
            if (ethers.isAddress(input)) {
                tx = await contract.addFriend(input);
            } else {
                tx = await contract.addFriendByUsername(input);
            }
            await tx.wait();
            setIsModalOpen(false);
            setFriendAddress('');
        } catch (err) { setError(err.reason || "Failed to add friend."); }
    };

    return (
        <>
            <aside className="contacts-panel">
                <header className="contacts-header">
                    <div className="user-profile">
                        <Avatar name={username} />
                        <div className="user-info">
                            <h2>{username}</h2>
                            <p>{account}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} title="Add Friend" className="view-button" style={{padding: '0.5rem'}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>
                    </button>
                </header>
                <div className="contact-list">
                    {contacts.map(contact => (
                        <div key={contact.id} className={`contact-item ${activeChat?.id === contact.id ? 'active' : ''}`} onClick={() => onSelectChat(contact)}>
                            <Avatar name={contact.name} />
                            <div className="user-info">
                                <h2>{contact.name}</h2>
                                <p>{contact.id}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add a Friend" onAction={handleAddFriend} actionText="Add" showAction={true}>
                <p className="view-subtitle" style={{marginBottom: '1rem'}}>Enter your friend's username or full Ethereum address.</p>
                <input type="text" placeholder="Username or 0x..." value={friendAddress} onChange={(e) => setFriendAddress(e.target.value)} className="view-input"/>
                {error && <p style={{color: 'red', marginTop: '0.5rem'}}>{error}</p>}
            </Modal>
        </>
    );
};
export default ContactsPanel;