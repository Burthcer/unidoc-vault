// File: lib/crypto.ts
"use client";

// Derives a strong AES-GCM key from a user's password using PBKDF2
const getPasswordKey = async (password: string, salt: Uint8Array) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptFile = async (file: File, password: string): Promise<Blob> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await getPasswordKey(password, salt);
  const buffer = await file.arrayBuffer();
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    buffer
  );

  // Pack the salt, IV, and ciphertext together into a single Blob
  return new Blob([salt, iv, encryptedBuffer]);
};

export const decryptFile = async (
  encryptedBlob: Blob, 
  password: string, 
  originalName: string, 
  originalType: string
): Promise<File> => {
  const buffer = await encryptedBlob.arrayBuffer();
  
  // Extract the packed salt and IV
  const salt = new Uint8Array(buffer.slice(0, 16));
  const iv = new Uint8Array(buffer.slice(16, 28));
  const encryptedData = buffer.slice(28);

  const key = await getPasswordKey(password, salt);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedData
  );

  return new File([decryptedBuffer], originalName, { type: originalType });
};