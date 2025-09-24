import React from 'react';

const stringToHash = (str) => {
    let hash = 0;
    if (!str) return hash;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
};
const colors = ['#4f46e5', '#db2777', '#059669', '#d97706', '#6d28d9', '#0891b2', '#be185d', '#047857', '#65a30d', '#5b21b6'];

const Avatar = ({ name }) => {
    const colorIndex = Math.abs(stringToHash(name)) % colors.length;
    const bgColor = colors[colorIndex];
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return <div className="avatar" style={{ backgroundColor: bgColor }}>{initial}</div>;
};

export default Avatar;