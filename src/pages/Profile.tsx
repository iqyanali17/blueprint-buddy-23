import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import UserProfile from '@/components/UserProfile';

const Profile = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 py-8 relative">
          <div className="container mx-auto px-4">
            <div className="flex justify-end mb-4 max-w-4xl mx-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                title="Exit without saving"
                className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <UserProfile />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Profile;
