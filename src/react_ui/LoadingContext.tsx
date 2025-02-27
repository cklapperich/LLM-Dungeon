import React, { createContext, useState, useContext } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType>({
    isLoading: false,
    setIsLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};
