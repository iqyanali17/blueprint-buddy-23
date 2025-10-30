import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, User, Menu, X, LogOut } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const accountType = (user?.user_metadata as any)?.account_type as 'patient' | 'doctor' | 'admin' | undefined;
  const specialty = (user?.user_metadata as any)?.specialty as string | undefined;
  const roleLabel = accountType === 'doctor' ? (specialty ? `Doctor – ${specialty}` : 'Doctor') : accountType === 'admin' ? 'Admin' : accountType === 'patient' ? 'Patient' : undefined;
  const displayName = (user?.user_metadata as any)?.full_name || user?.email || '';
  const avatarUrl = (user?.user_metadata as any)?.avatar_url as string | undefined;
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n: string) => n.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

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
                    <AvatarImage src={avatarUrl} alt={displayName || 'User'} />
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
                {accountType === 'doctor' && (
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/doctor/inbox'}>
                    Inbox
                  </Button>
                )}
                {accountType === 'admin' && (
                  <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/inbox'}>
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
                        <AvatarImage src={avatarUrl} alt={displayName || 'User'} />
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