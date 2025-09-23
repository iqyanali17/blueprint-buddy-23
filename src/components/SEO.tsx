import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = 'MEDITALK - AI-Powered Medical Assistant | 24/7 Healthcare Guidance',
  description = 'Get instant medical guidance with MEDITALK\'s AI-powered healthcare assistant. Symptom checker, image analysis, medication tracking, and multilingual support available 24/7.',
  keywords = 'AI medical assistant, healthcare AI, symptom checker, medical guidance, telemedicine, health app, medical consultation, AI diagnosis, healthcare technology',
  ogImage = '/meditalk-og-image.jpg',
  canonicalUrl = 'https://meditalk.ai',
  structuredData
}) => {
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": "MEDITALK",
    "description": description,
    "url": canonicalUrl,
    "about": {
      "@type": "MedicalCondition",
      "name": "General Medical Guidance"
    },
    "provider": {
      "@type": "Organization",
      "name": "MEDITALK",
      "description": "AI-powered medical assistance platform",
      "url": canonicalUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${canonicalUrl}/logo.png`
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-555-123-4567",
        "contactType": "customer service",
        "availableLanguage": ["English", "Spanish", "French", "German", "Hindi"]
      }
    },
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "MEDITALK AI Assistant",
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "1247",
        "bestRating": "5",
        "worstRating": "1"
      }
    }
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="MEDITALK" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      <meta property="twitter:creator" content="@MeditalkAI" />
      
      {/* Medical-specific meta tags */}
      <meta name="medical-disclaimer" content="This website provides general medical information and is not intended to replace professional medical advice, diagnosis, or treatment." />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      
      {/* Language alternatives */}
      <link rel="alternate" hrefLang="en" href={`${canonicalUrl}/en`} />
      <link rel="alternate" hrefLang="es" href={`${canonicalUrl}/es`} />
      <link rel="alternate" hrefLang="fr" href={`${canonicalUrl}/fr`} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      
      {/* Favicon and app icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      
      {/* PWA manifest */}
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="MEDITALK" />
      
      {/* Security headers */}
      <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    </Helmet>
  );
};

export default SEO;