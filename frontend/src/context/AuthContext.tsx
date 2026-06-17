/**
 * Project: FUSION NEURAL
 * context/AuthContext.tsx — Authentication with Firestore-based RBAC
 *
 * Role is fetched from Firestore users/{uid} document, NOT from email prefix.
 * companyId enables multi-tenant data isolation.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, createUserProfile, updateLastLogin } from '../services/userService';
import type { UserProfile, UserRole } from '../services/userService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  userRole: UserRole | null;
  companyId: string | null;
  userProfile: UserProfile | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback(async (user: User) => {
    try {
      let profile = await getUserProfile(user.uid);

      if (!profile) {
        // First login — create profile with default role
        profile = await createUserProfile(
          user.uid,
          user.email || '',
          user.displayName || user.email?.split('@')[0] || 'User',
        );
      } else {
        // Update last login (non-blocking)
        updateLastLogin(user.uid);
      }

      setUserProfile(profile);
      setUserRole(profile.role);
      setCompanyId(profile.companyId);
    } catch (err) {
      console.error('[Auth] Failed to fetch/create profile:', err);
      // Fallback: derive role from email prefix (migration path)
      const prefix = user.email?.split('@')[0] || 'viewer';
      const fallbackRole = ['owner', 'manager', 'admin', 'finance', 'marketing'].includes(prefix)
        ? (prefix as UserRole)
        : 'viewer';
      setUserRole(fallbackRole);
      setCompanyId(`company_${user.uid}`);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        await fetchProfile(user);
      } else {
        setUserRole(null);
        setCompanyId(null);
        setUserProfile(null);
      }

      setLoading(false);
    }, (_error) => {
      console.warn('[Auth] Firebase Auth error, continuing as guest.', _error);
      setLoading(false);
    });

    // Fallback: unblock app if Firebase doesn't respond in 5 seconds
    const fallbackTimer = setTimeout(() => setLoading(false), 5000);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [fetchProfile]);

  const logout = async () => {
    try {
      await signOut(auth);
      window.location.replace('/');
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
    }
  };

  const refreshProfile = useCallback(async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  }, [currentUser, fetchProfile]);

  const value: AuthContextType = {
    currentUser,
    loading,
    userRole,
    companyId,
    userProfile,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
