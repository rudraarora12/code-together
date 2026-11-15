import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  isFirebaseConfigured, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  signInWithPopup,
  googleProvider 
} from '../services/firebase';

const AuthContext = createContext(null);

export const DEMO_USERS = [
  {
    id: 'user-1',
    name: 'Alex Rivera',
    email: 'alex@codetogether.dev',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Lead Architect',
    color: '#89b4fa',
    bio: 'Building distributed real-time software systems.'
  },
  {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah@codetogether.dev',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'Frontend Specialist',
    color: '#cba6f7',
    bio: 'React, TypeScript and Monaco editor wizard.'
  },
  {
    id: 'user-3',
    name: 'Marcus Vance',
    email: 'marcus@codetogether.dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Systems Engineer',
    color: '#a6e3a1',
    bio: 'Containers, Kubernetes, and low-latency networking.'
  }
];

function formatFirebaseAuthError(err) {
  const code = err.code || '';
  const rawMessage = (err.message || '').replace(/^Firebase:\s*/, '');
  const error = new Error();
  error.code = code;

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      error.message = 'Invalid email or password. Please verify your credentials.';
      break;
    case 'auth/email-already-in-use':
      error.message = 'This email address is already in use. Please sign in instead.';
      break;
    case 'auth/weak-password':
      error.message = 'Password must be at least 6 characters long.';
      break;
    case 'auth/invalid-email':
      error.message = 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      error.message = 'Too many failed attempts. Please try again in a few moments.';
    case 'auth/popup-closed-by-user':
      error.message = 'Google sign-in popup was closed before finishing.';
      break;
    case 'auth/network-request-failed':
      error.message = 'Network error connecting to Firebase. Please check your internet connection.';
      break;
    case 'auth/operation-not-allowed':
      error.message = `[${code}] ${rawMessage || 'The requested sign-in operation is not permitted.'}`;
      break;
    default:
      error.message = code ? `[${code}] ${rawMessage || 'Authentication failed.'}` : (rawMessage || 'Authentication failed. Please try again.');
      break;
  }
  return error;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('codetogether_user');
    return saved ? JSON.parse(saved) : DEMO_USERS[0];
  });

  const [loading, setLoading] = useState(true);

  const [recentRooms, setRecentRooms] = useState(() => {
    const saved = localStorage.getItem('codetogether_recent_rooms');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'room-react-dashboard',
        name: 'Distributed Algorithms Lab',
        description: 'Implementing consensus protocols and distributed state machines',
        language: 'javascript',
        collaboratorsCount: 3,
        collaborators: [
          { name: 'Alex Rivera', avatar: DEMO_USERS[0].avatar },
          { name: 'Sarah Chen', avatar: DEMO_USERS[1].avatar },
          { name: 'Marcus Vance', avatar: DEMO_USERS[2].avatar }
        ],
        lastActive: '10 minutes ago',
        isOwner: true,
        filesCount: 4
      },
      {
        id: 'room-python-primes',
        name: 'Python Sandbox & Math Utilities',
        description: 'Prime factorization and performance benchmark suite',
        language: 'python',
        collaboratorsCount: 2,
        collaborators: [
          { name: 'Alex Rivera', avatar: DEMO_USERS[0].avatar },
          { name: 'Marcus Vance', avatar: DEMO_USERS[2].avatar }
        ],
        lastActive: '2 hours ago',
        isOwner: false,
        filesCount: 2
      }
    ];
  });

  // Listen to Firebase Auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const appUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Developer',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          role: 'Developer',
          color: '#89b4fa',
          isFirebase: true
        };
        setUser(appUser);
      } else {
        // If current user was a Firebase user and signed out, reset
        setUser(prev => (prev?.isFirebase ? null : prev));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('codetogether_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('codetogether_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('codetogether_recent_rooms', JSON.stringify(recentRooms));
  }, [recentRooms]);

  // Firebase Email/Password Sign-In
  const login = async (email, password) => {
    if (auth && isFirebaseConfigured) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCred.user;
        const appUser = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Developer',
          email: fbUser.email,
          avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          role: 'Developer',
          color: '#89b4fa',
          isFirebase: true
        };
        setUser(appUser);
        return appUser;
      } catch (err) {
        throw formatFirebaseAuthError(err);
      }
    }

    // Demo fallback when offline or without Firebase config
    const existing = DEMO_USERS.find(u => u.email === email) || {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'Developer',
      color: '#89b4fa'
    };
    setUser(existing);
    return existing;
  };

  // Firebase Email/Password Registration
  const signup = async ({ name, email, password, role, avatar }) => {
    if (auth && isFirebaseConfigured) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCred.user;

        try {
          await firebaseUpdateProfile(fbUser, {
            displayName: name,
            photoURL: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
          });
        } catch (_) {}

        const appUser = {
          id: fbUser.uid,
          name: name || fbUser.displayName || 'Developer',
          email: fbUser.email,
          role: role || 'Software Engineer',
          avatar: avatar || fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          color: '#89b4fa',
          isFirebase: true
        };
        setUser(appUser);
        return appUser;
      } catch (err) {
        throw formatFirebaseAuthError(err);
      }
    }

    // Fallback registration
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: role || 'Software Engineer',
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      color: '#89b4fa',
      bio: 'Ready to build awesome software together.'
    };
    setUser(newUser);
    return newUser;
  };

  // 1-Click Google Sign-In
  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      throw new Error('Google Sign-In is not configured.');
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const appUser = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Developer',
        email: fbUser.email,
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: 'Developer',
        color: '#89b4fa',
        isFirebase: true
      };
      setUser(appUser);
      return appUser;
    } catch (err) {
      throw formatFirebaseAuthError(err);
    }
  };

  const quickLoginAs = (demoUser) => {
    setUser(demoUser);
  };

  const logout = async () => {
    if (auth && isFirebaseConfigured) {
      try {
        await firebaseSignOut(auth);
      } catch (_) {}
    }
    setUser(null);
  };

  const updateProfile = (fields) => {
    setUser(prev => ({ ...prev, ...fields }));
  };

  const recordRoomVisit = (roomData) => {
    setRecentRooms(prev => {
      const filtered = prev.filter(r => r.id !== roomData.id);
      return [
        {
          id: roomData.id,
          name: roomData.name || 'Untitled Room',
          language: roomData.language || 'javascript',
          description: roomData.description || 'Collaborative coding session',
          collaboratorsCount: roomData.collaboratorsCount || 1,
          collaborators: roomData.collaborators || [{ name: user?.name, avatar: user?.avatar }],
          lastActive: 'Just now',
          isOwner: roomData.isOwner ?? false,
          filesCount: roomData.filesCount || 1
        },
        ...filtered
      ];
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      loginWithGoogle,
      quickLoginAs,
      logout,
      updateProfile,
      recentRooms,
      recordRoomVisit,
      isFirebaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
