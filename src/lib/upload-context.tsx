"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UploadContextType {
  file: File | null;
  setFile: (file: File | null) => void;
  clearFile: () => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadContextProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const clearFile = () => {
    setFile(null);
    setActiveSessionId(null);
  };

  return (
    <UploadContext.Provider
      value={{
        file,
        setFile,
        clearFile,
        activeSessionId,
        setActiveSessionId,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUploadContext(): UploadContextType {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUploadContext must be used within an UploadContextProvider');
  }
  return context;
}
