import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Mail, 
  Clock, 
  Code, 
  Search, 
  Filter,
  MoreVertical,
  ChevronRight,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { User } from '../types';

interface UsersViewProps {
  users: User[];
}

const UsersView = ({ users }: UsersViewProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.uid || null);
  const selectedUser = users.find(u => u.uid === selectedUserId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-auto lg:h-[calc(100vh-180px)]">
      {/* Left Column: User List */}
      <div className="lg:col-span-4 flex flex-col gap-6 h-[500px] lg:h-full">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 blue-glow animate-pulse" />
            <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">System Data Explorer</h2>
          </div>
          <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{users.length} Records Found</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {users.map((user) => (
              <motion.div
                key={user.uid}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedUserId(user.uid)}
                className={cn(
                  "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                  selectedUserId === user.uid 
                    ? "bg-blue-500/10 border-blue-500/30 blue-glow" 
                    : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700 backdrop-blur-md"
                )}
              >
                <div className="flex items-center gap-4">
                  <img 
                    src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                    alt={user.displayName} 
                    className="w-10 h-10 rounded-xl border border-zinc-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-zinc-100 truncate group-hover:text-blue-400 transition-colors">
                      {user.displayName || 'Anonymous User'}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate font-medium uppercase tracking-wider">
                      {user.email}
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                    user.role === 'admin' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  )}>
                    {user.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Record Detail */}
      <div className="lg:col-span-8 h-full">
        <AnimatePresence mode="wait">
          {selectedUser ? (
            <motion.div 
              key={selectedUser.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full flex flex-col gap-6"
            >
              {/* Profile Header */}
              <div className="bento-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-zinc-700 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <img 
                    src={selectedUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.uid}`} 
                    alt={selectedUser.displayName} 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl border border-zinc-800 group-hover:border-blue-500/30 transition-colors shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">{selectedUser.displayName || 'Anonymous User'}</h2>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                        selectedUser.role === 'admin' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      )}>
                        {selectedUser.role}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} className="text-zinc-600" />
                        {selectedUser.email}
                      </span>
                      <span className="hidden sm:block w-1 h-1 rounded-full bg-zinc-800" />
                      <span className="flex items-center gap-1.5">
                        <Database size={12} className="text-zinc-600" />
                        ID: {selectedUser.uid}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Real-time Sync</div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse emerald-glow" />
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              </div>

              {/* Raw Data View */}
              <div className="flex-1 bento-card p-6 sm:p-8 flex flex-col overflow-hidden group hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                      <Code size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Raw Document Data</h3>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Read-only view</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-4 sm:p-6 font-mono text-xs overflow-auto custom-scrollbar">
                  <pre className="text-blue-400 leading-relaxed whitespace-pre-wrap break-all">
                    {JSON.stringify({
                      id: selectedUser.uid,
                      createdAt: selectedUser.created_at?.toDate ? selectedUser.created_at.toDate().toISOString() : selectedUser.created_at,
                      displayName: selectedUser.displayName,
                      role: selectedUser.role,
                      lastLogin: selectedUser.lastLogin?.toDate ? selectedUser.lastLogin.toDate().toISOString() : selectedUser.lastLogin,
                      email: selectedUser.email,
                      photoURL: selectedUser.photoURL
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full bento-card flex flex-col items-center justify-center text-center p-12 group hover:border-zinc-800 transition-colors">
              <div className="w-24 h-24 bg-zinc-900/50 rounded-3xl flex items-center justify-center mb-8 border border-zinc-800/50 group-hover:border-blue-500/50 transition-all duration-500 backdrop-blur-xl">
                <Users size={40} className="text-zinc-800 group-hover:text-blue-500 transition-colors" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100 mb-3 uppercase tracking-tight">Select Record</h2>
              <p className="max-w-xs text-xs font-medium text-zinc-500 leading-relaxed uppercase tracking-widest">
                Choose a user record from the system collection to inspect raw document metadata and institutional permissions.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(UsersView);
