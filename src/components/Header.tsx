import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, Menu, X, LogOut, Bell, Clock, LayoutDashboard, ChevronRight, Shield, Stethoscope } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const accountType = (user?.user_metadata as any)?.account_type as 'patient' | 'doctor' | 'admin' | undefined;
  const specialty = (user?.user_metadata as any)?.specialty as string | undefined;
  const roleLabel = accountType === 'doctor' ? (specialty ? `Dr – ${specialty}` : 'Doctor') : accountType === 'admin' ? 'Admin' : accountType === 'patient' ? 'Patient' : undefined;
  const [profileName, setProfileName] = useState<string | undefined>(undefined);
  const displayName = profileName || (user?.user_metadata as any)?.full_name || user?.email || '';
  const avatarUrl = (user?.user_metadata as any)?.avatar_url as string | undefined;
  const [profileAvatar, setProfileAvatar] = useState<string | undefined>(undefined);

  const firstName = displayName ? displayName.split(' ')[0] : '';
  const initials = displayName
    ? displayName.split(' ').map((n: string) => n.charAt(0)).slice(0, 2).join('').toUpperCase()
    : 'U';

  const [inboxOpen, setInboxOpen] = useState(false);
  const [tab, setTab] = useState<'messages' | 'logins'>('messages');
  const [support, setSupport] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const inboxRef = useRef<HTMLDivElement | null>(null);

  // Close inbox on outside click
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (inboxRef.current && !inboxRef.current.contains(e.target as Node)) setInboxOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setIsMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Admin inbox realtime
  useEffect(() => {
    if (accountType !== 'admin') return;
    const load = async () => {
      try {
        const supportResult = await (supabase as any).from('support_messages').select('*').order('created_at', { ascending: false }).limit(50);
        if (!supportResult.error && supportResult.data) setSupport(supportResult.data as any[]);
      } catch {}
    };
    load();
    const channel = supabase
      .channel('realtime:admin-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' } as any, (payload: any) => {
        setSupport(prev => [payload.new, ...prev]);
        setUnread(u => u + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [accountType]);

  // Profile avatar/name sync
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const fetchProfile = async () => {
      if (!user?.id) { setProfileAvatar(undefined); return; }
      try {
        const { data, error } = await (supabase as any)
          .from('profiles').select('avatar_url, full_name').eq('id', user.id).single();
        if (!error) {
          if (data?.avatar_url) setProfileAvatar(data.avatar_url as string);
          if (data?.full_name) setProfileName(data.full_name as string);
        }
      } catch {}
    };
    fetchProfile();
    if (user?.id) {
      channel = supabase
        .channel(`realtime:profile-avatar:${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` } as any, (payload: any) => {
          if (payload?.new?.avatar_url) setProfileAvatar(payload.new.avatar_url);
          if (payload?.new?.full_name !== undefined) setProfileName(payload.new.full_name || undefined);
        })
        .subscribe();
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [user?.id]);

  const effectiveAvatar = profileAvatar || avatarUrl;
  const totalBadge = useMemo(() => unread, [unread]);
  const fmt = (d: string | number | Date) => new Date(d).toLocaleString();

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#about', label: 'About' },
    { href: '#contact', label: 'Contact' },
  ];

  const RoleBadge = () => {
    if (!roleLabel) return null;
    const icon = accountType === 'admin' ? <Shield className="h-3 w-3" /> : accountType === 'doctor' ? <Stethoscope className="h-3 w-3" /> : null;
    return (
      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
        {icon}{roleLabel}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
          {/* Logo - always visible */}
          <div className="flex-shrink-0">
            <Logo size={36} showText className="cursor-pointer" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {user ? (
              <>
                {/* Profile chip - clickable */}
                <button
                  onClick={() => (window.location.href = '/profile')}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-muted/60 transition-colors max-w-[200px] lg:max-w-[260px]"
                >
                  <Avatar className="h-7 w-7 lg:h-8 lg:w-8 ring-2 ring-primary/20 flex-shrink-0">
                    <AvatarImage src={effectiveAvatar} alt={displayName || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium truncate hidden lg:block">{firstName}</span>
                  <RoleBadge />
                </button>

                {/* Admin inbox */}
                {accountType === 'admin' && (
                  <div className="relative" ref={inboxRef}>
                    <Button variant="outline" size="icon" className="relative h-8 w-8" onClick={() => { setInboxOpen(v => !v); setUnread(0); }}>
                      <Bell className="h-4 w-4" />
                      {totalBadge > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center text-[10px] rounded-full bg-destructive text-destructive-foreground px-1">{totalBadge}</span>
                      )}
                    </Button>
                    {inboxOpen && (
                      <div className="absolute right-0 mt-2 w-80 lg:w-96 bg-background border rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95">
                        <div className="px-4 py-3 border-b flex items-center justify-between">
                          <span className="font-semibold text-sm">Inbox</span>
                          <span className="text-[10px] text-muted-foreground">Real-time</span>
                        </div>
                        <div className="px-4 pt-3 flex gap-2">
                          <button className={`text-xs px-2 py-1 rounded-md border ${tab === 'messages' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setTab('messages')}>Support</button>
                          <button className={`text-xs px-2 py-1 rounded-md border ${tab === 'logins' ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setTab('logins')}>Logins</button>
                        </div>
                        <div className="max-h-[300px] overflow-auto p-2">
                          {tab === 'messages' ? (
                            support.length === 0 ? <div className="text-xs text-muted-foreground px-2 py-4">No messages</div> :
                            support.map(m => (
                              <div key={m.id} className="px-3 py-2 hover:bg-muted/40 rounded-md">
                                <div className="text-sm font-medium">{m.username || m.email || m.user_id}</div>
                                <div className="text-xs text-muted-foreground">{m.email}</div>
                                <div className="text-sm mt-1 line-clamp-2">{m.message}</div>
                                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{fmt(m.created_at)}</div>
                              </div>
                            ))
                          ) : (
                            logs.length === 0 ? <div className="text-xs text-muted-foreground px-2 py-4">No login activity</div> :
                            logs.map(l => (
                              <div key={l.id} className="px-3 py-2 hover:bg-muted/40 rounded-md">
                                <div className="text-sm font-medium">{l.username || l.email || l.user_id}</div>
                                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{fmt(l.login_time || l.created_at)}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {accountType === 'doctor' && (
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => (window.location.href = '/doctor/inbox')}>
                    <Bell className="h-3.5 w-3.5 mr-1" />Inbox
                  </Button>
                )}

                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} disabled={loading} title="Sign Out">
                  <LogOut className="h-4 w-4" />
                </Button>
                <Button variant="hero" size="sm" className="h-8 text-xs" onClick={() => (window.location.href = '/dashboard')}>
                  <LayoutDashboard className="h-3.5 w-3.5 mr-1" />Dashboard
                </Button>
                <ThemeToggle />
              </>
            ) : (
              <>
                <AuthModal trigger={<Button variant="ghost" size="sm" className="h-8 text-xs"><User className="h-3.5 w-3.5 mr-1" />Sign In</Button>} />
                <AuthModal trigger={<Button variant="hero" size="sm" className="h-8 text-xs"><MessageCircle className="h-3.5 w-3.5 mr-1" />Start Chat</Button>} defaultTab="signup" />
                <ThemeToggle />
              </>
            )}
          </div>

          {/* Mobile right side: profile chip + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button
                onClick={() => (window.location.href = '/profile')}
                className="flex items-center gap-1.5 px-1.5 py-1 rounded-full hover:bg-muted/60 transition-colors"
              >
                <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                  <AvatarImage src={effectiveAvatar} alt={displayName || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{initials}</AvatarFallback>
                </Avatar>
                <RoleBadge />
              </button>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 sm:top-16 bottom-0 z-40 bg-background/98 backdrop-blur-sm overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {/* User profile card in mobile menu */}
            {user && (
              <div
                className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-muted/40 border cursor-pointer"
                onClick={() => { setIsMenuOpen(false); window.location.href = '/profile'; }}
              >
                <Avatar className="h-11 w-11 ring-2 ring-primary/20 flex-shrink-0">
                  <AvatarImage src={effectiveAvatar} alt={displayName || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RoleBadge />
                    <span className="text-[10px] text-muted-foreground">View Profile</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            )}

            {/* Nav links */}
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center h-11 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <div className="border-t my-3" />

            {user ? (
              <div className="space-y-1">
                <button
                  onClick={() => { setIsMenuOpen(false); window.location.href = '/dashboard'; }}
                  className="flex items-center gap-2 w-full h-11 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-primary" />Dashboard
                </button>

                <button
                  onClick={() => { setIsMenuOpen(false); window.location.href = '/support'; }}
                  className="flex items-center gap-2 w-full h-11 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-primary" />Contact Admin
                </button>

                <button
                  onClick={() => { setIsMenuOpen(false); window.location.href = '/doctor-chat'; }}
                  className="flex items-center gap-2 w-full h-11 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Stethoscope className="h-4 w-4 text-primary" />Chat with Doctor
                </button>

                {accountType === 'doctor' && (
                  <button
                    onClick={() => { setIsMenuOpen(false); window.location.href = '/doctor/inbox'; }}
                    className="flex items-center gap-2 w-full h-11 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Bell className="h-4 w-4 text-primary" />Doctor Inbox
                  </button>
                )}

                {accountType === 'admin' && (
                  <button
                    onClick={() => { setIsMenuOpen(false); window.location.href = '/admin'; }}
                    className="flex items-center gap-2 w-full h-11 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Shield className="h-4 w-4 text-primary" />Admin Panel
                  </button>
                )}

                <div className="border-t my-3" />

                <button
                  onClick={() => { setIsMenuOpen(false); signOut(); }}
                  disabled={loading}
                  className="flex items-center gap-2 w-full h-11 px-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <AuthModal
                  trigger={
                    <Button variant="outline" className="w-full justify-center h-11">
                      <User className="h-4 w-4 mr-2" />Sign In
                    </Button>
                  }
                />
                <AuthModal
                  trigger={
                    <Button variant="hero" className="w-full justify-center h-11">
                      <MessageCircle className="h-4 w-4 mr-2" />Start Chat
                    </Button>
                  }
                  defaultTab="signup"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
