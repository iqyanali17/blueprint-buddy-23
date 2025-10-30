import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import UserProfile from '@/components/UserProfile';

const Profile = () => {
  return (
    <>
      <SEO />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <UserProfile />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Profile;
