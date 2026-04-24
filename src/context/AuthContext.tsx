import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  userRole: string | null;
  logout: () => Promise<void>;
}

// Inisialisasi context
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Custom hook untuk memudahkan pemanggilan context di komponen lain
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Listener untuk memantau perubahan status login/logout dari Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Menentukan role dari prefix email
      if (user && user.email) {
        const prefix = user.email.split('@')[0];
        setUserRole(prefix);
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // FUNGSI LOGOUT YANG SUDAH DIUBAH
  const logout = async () => {
    try {
      // 1. Jalankan proses logout Firebase
      await signOut(auth);
      
      // 2. Arahkan langsung ke Landing Page (ganti '/' jika path landing page Anda berbeda)
      // Menggunakan window.location.href sangat aman di sini karena akan me-reset seluruh state aplikasi
      window.location.href = '/'; 
    } catch (error) {
      console.error("Gagal melakukan logout:", error);
    }
  };

  const value = {
    currentUser,
    loading,
    userRole,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};