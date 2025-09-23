import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Stethoscope, User, Menu, X, LogOut } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-hero rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              MEDITALK
            </span>
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
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-medical" />
                  <span className="text-sm font-medium">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={signOut} disabled={loading}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
                <Button variant="hero" size="sm" onClick={() => window.location.href = '/dashboard'}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
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
                    <div className="flex items-center space-x-2 px-2 py-1">
                      <User className="h-4 w-4 text-medical" />
                      <span className="text-sm font-medium">
                        {user.user_metadata?.full_name || user.email}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={signOut} disabled={loading}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                    <Button variant="hero" size="sm" onClick={() => window.location.href = '/dashboard'}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
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