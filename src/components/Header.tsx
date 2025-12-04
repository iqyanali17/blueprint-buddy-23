import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, Menu, X, LogOut, Bell, Clock } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth(true, true);
  const accountType = (user?.user_metadata as any)?.account_type as 'patient' | 'doctor' | 'admin' | undefined;
  const specialty = (user?.user_metadata as any)?.specialty as string | undefined;
  const roleLabel = accountType === 'doctor' ? (specialty ? `Doctor – ${specialty}` : 'Doctor') : accountType === 'admin' ? 'Admin' : accountType === 'patient' ? 'Patient' : undefined;
  const [profileName, setProfileName] = useState<string | undefined>(undefined);
  const displayName = profileName || (user?.user_metadata as any)?.full_name || user?.email || '';
  const avatarUrl = (user?.user_metadata as any)?.avatar_url as string | undefined;
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(undefined);
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n: string) => n.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const [inboxOpen, setInboxOpen] = useState(false);
  const [tab, setTab] = useState<'messages' | 'logins'>('messages');
  const [support, setSupport] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const inboxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (inboxRef.current && !inboxRef.current.contains(e.target as Node)) setInboxOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (accountType !== 'admin') return;
    
    const load = async () => {
      try {
        // Try to load support messages - silently fail if table doesn't exist
        const supportResult = await (supabase as any).from('support_messages').select('*').order('created_at', { ascending: false }).limit(50);
        if (!supportResult.error && supportResult.data) {
          setSupport(supportResult.data as any[]);
        }
      } catch {
        // Table doesn't exist, ignore
      }
      
      // Note: user_logs table doesn't exist in this schema, so we skip it
      // setLogs will remain empty
    };
    
    load();

    // Only subscribe to support_messages as user_logs doesn't exist
    const channel = supabase
      .channel('realtime:admin-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' } as any, (payload: any) => {
        const row = payload.new;
        setSupport(prev => [row, ...prev]);
        setUnread(u => u + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountType]);

  // Keep avatar and name in sync with profiles table changes and initial fetch
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const fetchAvatar = async () => {
      if (!user?.id) { setProfileAvatar(undefined); return; }
      try {
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', user.id)
          .single();
        if (!error) {
          if (data?.avatar_url) setProfileAvatar(data.avatar_url as string);
          if (data?.full_name) setProfileName(data.full_name as string);
        }
      } catch {}
    };
    fetchAvatar();

    if (user?.id) {
      channel = supabase
        .channel(`realtime:profile-avatar:${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` } as any, (payload: any) => {
          const url = payload?.new?.avatar_url as string | undefined;
          const name = payload?.new?.full_name as string | undefined;
          if (url) setProfileAvatar(url);
          if (name !== undefined) setProfileName(name || undefined);
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` } as any, (payload: any) => {
          const url = payload?.new?.avatar_url as string | undefined;
          const name = payload?.new?.full_name as string | undefined;
          if (url) setProfileAvatar(url);
          if (name !== undefined) setProfileName(name || undefined);
        })
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const effectiveAvatar = profileAvatar || avatarUrl;

  const totalBadge = useMemo(() => unread, [unread]);
  const fmt = (d: string | number | Date) => new Date(d).toLocaleString();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Logo size={40} showText className="cursor-pointer" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a 
              href="#features" 
              className="text-sm font-medium text-foreground hover:text-primary transition-medical"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm font-medium text-foreground hover:text-primary transition-medical"
            >
              How It Works
            </a>
            <a 
              href="#about" 
              className="text-sm font-medium text-foreground hover:text-primary transition-medical"
            >
              About
            </a>
            <a 
              href="#contact" 
              className="text-sm font-medium text-foreground hover:text-primary transition-medical"
            >
              Contact
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 cursor-pointer select-none" onClick={() => (window.location.href = '/profile')}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={effectiveAvatar} alt={displayName || 'User'} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {displayName}
                  </span>
                  {roleLabel && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground border">
                      {roleLabel}
                    </span>
                  )}
                </div>
                {accountType === 'admin' && (
                  <div className="relative" ref={inboxRef}>
                    <Button variant="outline" size="sm" onClick={() => { setInboxOpen(v=>!v); setUnread(0); }}>
                      <Bell className="h-4 w-4 mr-2" />
                      Inbox
                      {totalBadge > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center text-xs rounded-full bg-primary text-primary-foreground px-2 py-0.5">{totalBadge}</span>
                      )}
                    </Button>
                    {inboxOpen && (
                      <div className="absolute right-0 mt-2 w-96 bg-background border rounded-md shadow-lg p-0 animate-in fade-in-0 zoom-in-95">
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                          <div className="font-semibold text-sm">Inbox</div>
                          <div className="text-xs text-muted-foreground">Real-time</div>
                        </div>
                        <div className="px-4 pt-3 flex gap-2">
                          <button className={`text-xs px-2 py-1 rounded-md border ${tab==='messages'?'bg-primary text-primary-foreground':''}`} onClick={()=>setTab('messages')}>Support</button>
                          <button className={`text-xs px-2 py-1 rounded-md border ${tab==='logins'?'bg-primary text-primary-foreground':''}`} onClick={()=>setTab('logins')}>Recent Logins</button>
                        </div>
                        {tab==='messages' ? (
                          <div className="max-h-[350px] overflow-auto p-2">
                            {support.length===0 && <div className="text-xs text-muted-foreground px-2 py-4">No messages</div>}
                            {support.map(m => (
                              <div key={m.id} className="px-3 py-2 hover:bg-muted/40 rounded-md">
                                <div className="text-sm font-medium">{m.username || m.email || m.user_id}</div>
                                <div className="text-xs text-muted-foreground">{m.email}</div>
                                <div className="text-sm mt-1 line-clamp-2">{m.message}</div>
                                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {fmt(m.created_at)}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="max-h-[350px] overflow-auto p-2">
                            {logs.length===0 && <div className="text-xs text-muted-foreground px-2 py-4">No login activity</div>}
                            {logs.map(l => (
                              <div key={l.id} className="px-3 py-2 hover:bg-muted/40 rounded-md">
                                <div className="text-sm font-medium">{l.username || l.email || l.user_id}</div>
                                <div className="text-xs text-muted-foreground">{l.email} • {l.status}</div>
                                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {fmt(l.login_time || l.created_at)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {accountType === 'doctor' && (
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/doctor/inbox'}>
                    Inbox
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={signOut} disabled={loading}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
                <Button variant="hero" size="sm" onClick={() => window.location.href = '/dashboard'}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <ThemeToggle />
              </div>
            ) : (
              <>
                <AuthModal 
                  trigger={
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  } 
                />
                <AuthModal 
                  trigger={
                    <Button variant="hero" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Chat
                    </Button>
                  }
                  defaultTab="signup"
                />
                <ThemeToggle />
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t animate-slide-up">
            <nav className="flex flex-col space-y-4">
              <a 
                href="#features" 
                className="text-sm font-medium text-foreground hover:text-primary transition-medical px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-sm font-medium text-foreground hover:text-primary transition-medical px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </a>
              <a 
                href="#about" 
                className="text-sm font-medium text-foreground hover:text-primary transition-medical px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#contact" 
                className="text-sm font-medium text-foreground hover:text-primary transition-medical px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>
              <div className="flex flex-col space-y-2 pt-4 border-t">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 px-2 py-1 cursor-pointer select-none" onClick={() => (window.location.href = '/profile')}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={effectiveAvatar} alt={displayName || 'User'} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{displayName}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={signOut} disabled={loading}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                    <Button variant="hero" size="sm" onClick={() => window.location.href = '/dashboard'}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    <ThemeToggle className="self-start" />
                  </div>
                ) : (
                  <>
                    <AuthModal 
                      trigger={
                        <Button variant="ghost" size="sm">
                          <User className="h-4 w-4 mr-2" />
                          Sign In
                        </Button>
                      } 
                    />
                    <AuthModal 
                      trigger={
                        <Button variant="hero" size="sm">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Start Chat
                        </Button>
                      }
                      defaultTab="signup"
                    />
                    <ThemeToggle className="self-start" />
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;