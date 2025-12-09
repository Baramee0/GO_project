import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
              w-full px-4 py-3 ${icon ? 'pl-10' : ''}
              glass-dark rounded-lg
              text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-all duration-300
              ${error ? 'ring-2 ring-red-500' : ''}
              ${className}
            `}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-400 animate-slide-down">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
