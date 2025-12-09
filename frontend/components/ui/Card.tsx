import React, { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
    return (
        <div
            className={`
        glass-card p-6
        ${hover ? 'hover-glow hover:scale-105 cursor-pointer' : ''}
        transition-all duration-300
        ${className}
      `}
        >
            {children}
        </div>
    );
};

export default Card;
