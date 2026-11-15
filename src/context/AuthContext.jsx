import React, { createContext, useContext, useState, useEffect } from 'react';

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('codetogether_user');
    return saved ? JSON.parse(saved) : DEMO_USERS[0];
  });

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
      },
      {
        id: 'room-cpp-engine',
        name: 'High-Performance Graphics Math',
        description: 'Vector and matrix calculations with SIMD optimization',
        language: 'cpp',
        collaboratorsCount: 4,
        collaborators: [
          { name: 'Alex Rivera', avatar: DEMO_USERS[0].avatar },
          { name: 'Sarah Chen', avatar: DEMO_USERS[1].avatar }
        ],
        lastActive: 'Yesterday',
        isOwner: false,
        filesCount: 3
      }
    ];
  });

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

  const login = (email, password) => {
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

  const quickLoginAs = (demoUser) => {
    setUser(demoUser);
  };

  const signup = ({ name, email, role, avatar }) => {
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

  const logout = () => {
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
          collaborators: roomData.collaborators || [{ name: user.name, avatar: user.avatar }],
          lastActive: 'Just now',
          isOwner: roomData.isOwner ?? false,
          filesCount: roomData.filesCount || 1
        },
        ...filtered
      ];
    });
  };

  const removeRecentRoom = (roomId) => {
    setRecentRooms(prev => prev.filter(r => r.id !== roomId));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        quickLoginAs,
        logout,
        updateProfile,
        recentRooms,
        recordRoomVisit,
        removeRecentRoom
      }}
    >
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
