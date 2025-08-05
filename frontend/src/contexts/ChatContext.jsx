import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../constants';

const ChatContext = createContext();

// The WebSocket URL for a default Hardhat node
const WEBSOCKET_URL = "ws://127.0.0.1:8545";

export const ChatProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [username, setUsername] = useState('');
    const [contract, setContract] = useState(null); // For sending transactions (with signer)
    const [readOnlyContract, setReadOnlyContract] = useState(null); // For listening to events
    const [error, setError] = useState('');

    const setupApp = useCallback(async (accountAddress) => {
        try {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const signedContract = new ethers.Contract(contractAddress, contractABI, web3Signer);
            
            const wsProvider = new ethers.WebSocketProvider(WEBSOCKET_URL);
            const eventContract = new ethers.Contract(contractAddress, contractABI, wsProvider);
            
            setAccount(accountAddress);
            setContract(signedContract);
            setReadOnlyContract(eventContract);

            const registeredName = await signedContract.getUser(accountAddress);
            if (registeredName) setUsername(registeredName);

        } catch (err) {
            console.error("Setup App Error:", err);
            setError("Failed to set up the application. Ensure your contract is deployed and the address/ABI are correct.");
        }
    }, []);

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) return setError("MetaMask is not installed.");
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) await setupApp(accounts[0]);
        } catch (err) {
            setError(`Connection Failed: ${err.message}`);
        }
    }, [setupApp]);

    useEffect(() => {
        const checkIfWalletIsConnected = async () => {
            if (!window.ethereum) return;
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) await setupApp(accounts[0]);
            } catch (err) {
                console.error("Failed to check wallet connection:", err);
            }
        };
        checkIfWalletIsConnected();
    }, [setupApp]);

    const value = { contract, readOnlyContract, account, username, error, connectWallet, setUsername };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => useContext(ChatContext);