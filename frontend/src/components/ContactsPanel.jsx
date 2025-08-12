import React, { useState, useEffect, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import Modal from './Modal';
import Avatar from './Avatar';
import { ethers } from 'ethers';

const ContactsPanel = ({ onSelectChat, activeChat }) => {
    const { contract, account } = useChat();
    const [contacts, setContacts] = useState([]);
    const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    
    // State for search and dropdown menu
    const [searchTerm, setSearchTerm] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // State for modal inputs
    const [friendAddress, setFriendAddress] = useState('');
    const [friendError, setFriendError] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupMembers, setGroupMembers] = useState('');
    const [groupError, setGroupError] = useState('');

    const fetchContactsAndGroups = useCallback(async () => {
        if (!contract || !account) return;
        try {
            const friendAddresses = await contract.getFriendList(account);
            const friends = await Promise.all(friendAddresses.map(async (address) => ({
                type: 'user', id: address, name: await contract.getUser(address) || 'Unnamed'
            })));

            const groupIds = await contract.getUserGroups(account);
            const groups = await Promise.all(groupIds.map(async (id) => {
                const details = await contract.getGroupDetails(id);
                return {
                    type: 'group', id: Number(details[0]), name: details[1], members: details[3]
                };
            }));
            
            setContacts([...friends, ...groups]);
        } catch(err) { console.error("Could not fetch contacts/groups:", err); }
    }, [contract, account]);

    useEffect(() => {
        if(contract) {
            fetchContactsAndGroups();
            const updateContacts = () => fetchContactsAndGroups();
            contract.on('FriendAdded', updateContacts);
            contract.on('GroupCreated', updateContacts);
            contract.on('MemberAddedToGroup', updateContacts);
            return () => {
                contract.off('FriendAdded', updateContacts);
                contract.off('GroupCreated', updateContacts);
                contract.off('MemberAddedToGroup', updateContacts);
            };
        }
    }, [contract, account, fetchContactsAndGroups]);

    const handleAddFriend = async () => {
        setFriendError('');
        const input = friendAddress.trim();
        if (!input) return setFriendError("Input cannot be empty.");
        try {
            const tx = ethers.isAddress(input)
                ? await contract.addFriend(input)
                : await contract.addFriendByUsername(input);
            await tx.wait();
            setIsFriendModalOpen(false);
            setFriendAddress('');
        } catch (err) { setFriendError(err.reason || "Failed to add friend."); }
    };

    const handleCreateGroup = async () => {
        setGroupError('');
        const name = groupName.trim();
        if (!name) return setGroupError("Group name cannot be empty.");
        const members = groupMembers.split(',').map(addr => addr.trim()).filter(addr => ethers.isAddress(addr));
        try {
            const tx = await contract.createGroup(name, members);
await tx.wait();
            setIsGroupModalOpen(false);
            setGroupName('');
            setGroupMembers('');
        } catch (err) { setGroupError(err.reason || "Failed to create group."); }
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModal = (type) => {
        if (type === 'friend') setIsFriendModalOpen(true);
        if (type === 'group') setIsGroupModalOpen(true);
        setIsMenuOpen(false);
    };

    return (
        <>
            <aside className="contacts-panel">
                <header className="contacts-header">
                    <h1 className="header-title">DChat</h1>
                    <div className="header-actions">
                        <div className="actions-menu">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="icon-button" title="More options">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                            </button>
                            {isMenuOpen && (
                                <div className="dropdown-menu">
                                    <button onClick={() => openModal('friend')} className="dropdown-item">Add New Friend</button>
                                    <button onClick={() => openModal('group')} className="dropdown-item">Create New Group</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search chats..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="contact-list">
                    {filteredContacts.map(contact => (
                        <div key={`${contact.type}-${contact.id}`} className={`contact-item ${activeChat?.id === contact.id && activeChat?.type === contact.type ? 'active' : ''}`} onClick={() => onSelectChat(contact)}>
                            <Avatar name={contact.name} />
                            <div className="user-info">
                                <h2>{contact.name}</h2>
                                {contact.type === 'user' ? <p>{contact.id}</p> : <p>{contact.members.length} members</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            <Modal isOpen={isFriendModalOpen} onClose={() => setIsFriendModalOpen(false)} title="Add a Friend" onAction={handleAddFriend} actionText="Add" showAction={true}>
                <p className="view-subtitle" style={{marginBottom: '1rem'}}>Enter a username or Ethereum address.</p>
                <input type="text" placeholder="Username or 0x..." value={friendAddress} onChange={(e) => setFriendAddress(e.target.value)} className="view-input"/>
                {friendError && <p style={{color: 'red', marginTop: '0.5rem'}}>{friendError}</p>}
            </Modal>

            <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Create a New Group" onAction={handleCreateGroup} actionText="Create" showAction={true}>
                <p className="view-subtitle" style={{marginBottom: '1rem'}}>Enter a name for your group.</p>
                <input type="text" placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="view-input"/>
                <p className="view-subtitle" style={{marginBottom: '1rem', marginTop: '1rem'}}>Optionally, add members by address (comma-separated).</p>
                <textarea placeholder="0x..., 0x..." value={groupMembers} onChange={(e) => setGroupMembers(e.target.value)} className="view-input" style={{height: '80px', resize: 'none'}} />
                {groupError && <p style={{color: 'red', marginTop: '0.5rem'}}>{groupError}</p>}
            </Modal>
        </>
    );
};

export default ContactsPanel;