import React from 'react';

const Modal = ({ isOpen, onClose, title, children, showAction, actionText, onAction }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="view-title" style={{marginBottom: '1rem'}}>{title}</h3>
                <div>{children}</div>
                <div className="modal-footer">
                    <button onClick={onClose} className="view-button" style={{backgroundColor: '#e5e7eb', color: '#1f2937'}}>Close</button>
                    {showAction && (
                         <button onClick={onAction} className="view-button">{actionText || 'Action'}</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;