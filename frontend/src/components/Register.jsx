import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';

const Register = () => {
    const { contract, setUsername } = useChat();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        if (!name.trim()) return setError('Username cannot be empty.');
        setLoading(true);
        setError('');
        try {
            const tx = await contract.createUser(name.trim());
            await tx.wait();
            setUsername(name.trim());
        } catch (err) {
            setError(err.reason || "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-view">
            <h2 className="view-title">Create Your Account</h2>
            <p className="view-subtitle">Your username must be unique.</p>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your username"
                className="view-input"
                disabled={loading}
            />
            <button onClick={handleRegister} className="view-button" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
            </button>
            {error && <p style={{color: 'red', marginTop: '1rem'}}>{error}</p>}
        </div>
    );
};

export default Register;