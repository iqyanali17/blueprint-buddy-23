import React from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Home, ArrowLeft, FileQuestion } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Page Not Found - MEDITALK"
        description="The page you're looking for doesn't exist. Return to MEDITALK for medical assistance."
      />
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-lg mx-auto shadow-medical border-0">
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-medical rounded-full flex items-center justify-center">
                <FileQuestion className="h-10 w-10 text-white" />
              </div>
              <Badge variant="outline" className="mb-2 border-medical text-medical">
                Error 404
              </Badge>
              <CardTitle className="text-3xl font-bold">Page Not Found</CardTitle>
              <CardDescription className="text-lg">
                The page you're looking for doesn't exist or has been moved.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Requested URL:</p>
                    <p className="text-sm text-muted-foreground font-mono break-all">
                      {location.pathname}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/')} 
                  variant="medical" 
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Return to Home
                </Button>
                
                <Button 
                  onClick={() => navigate(-1)} 
                  variant="outline" 
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  variant="healing" 
                  className="w-full"
                >
                  Medical Dashboard
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Need medical assistance? Our AI is always available to help.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
