# MEDITALK - AI Medical Assistant 🏥

**Your trusted AI-powered healthcare companion providing intelligent medical guidance, symptom assessment, and health management tools.**

## 🚀 Features

### Core Medical Features
- **🤖 AI Medical Chat** - 24/7 intelligent medical consultation
- **🔍 Symptom Checker** - Comprehensive symptom assessment with risk evaluation
- **📱 Image Analysis** - AI-powered medical image analysis for skin conditions, wounds, and more
- **💊 Medication Tracker** - Smart medication reminders and management
- **🚨 Emergency Guide** - Critical first aid information and emergency contacts
- **📊 Health Dashboard** - Personal health metrics and progress tracking
- **👤 Medical Profile** - Secure health history and personal medical information

### Advanced Capabilities
- **🔐 Secure Authentication** - HIPAA-compliant user authentication with Supabase
- **🌐 Multilingual Support** - Healthcare guidance in multiple languages
- **📱 PWA Ready** - Progressive Web App for mobile and desktop
- **♿ Accessibility** - WCAG 2.1 compliant interface
- **🌓 Dark/Light Mode** - Comfortable viewing in any environment
- **⚡ Real-time Sync** - Instant data synchronization across devices

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework with custom medical design system
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing

### Backend & Database
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Row Level Security** - User data isolation and privacy protection
- **Authentication** - Secure user management with JWT tokens

### UI Components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful medical icons
- **Sonner** - Toast notifications
- **React Hook Form** - Form management with validation

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ or Bun runtime
- Supabase account for backend services

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy the SQL commands from `DATABASE_SETUP.md`
   - Run them in your Supabase SQL editor
   - Update `src/lib/supabase.ts` with your project URL and anon key

4. **Start development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/               # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── ChatInterface.tsx    # AI chat functionality
│   ├── SymptomChecker.tsx   # Symptom assessment
│   ├── ImageAnalysis.tsx    # Medical image analysis
│   ├── MedicationTracker.tsx # Medication management
│   ├── EmergencyGuide.tsx   # Emergency information
│   ├── HealthDashboard.tsx  # Health overview
│   └── UserProfile.tsx      # Profile management
├── hooks/
│   ├── useAuth.ts       # Authentication hook
│   ├── useChat.ts       # Chat functionality
│   └── use-toast.ts     # Toast notifications
├── lib/
│   ├── supabase.ts      # Supabase client & types
│   └── utils.ts         # Utility functions
├── pages/
│   ├── Index.tsx        # Landing page
│   ├── Dashboard.tsx    # Main medical dashboard
│   └── NotFound.tsx     # 404 error page
└── assets/              # Images and static files
```

## 🔧 Configuration

### Design System
The app uses a comprehensive medical design system defined in:
- `src/index.css` - CSS custom properties and medical color tokens
- `tailwind.config.ts` - Tailwind configuration with medical theme
- Medical semantic colors: `medical`, `healing`, `emergency`

### Environment Variables
Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

### Production Build
```bash
npm run build
# or
bun run build
```

### Deploy to Lovable
Simply open [Lovable](https://lovable.dev/projects/917622df-1695-4521-8177-5b5be1e87d7a) and click on Share -> Publish.

## 🔒 Security & Privacy

- **HIPAA Compliance** - All medical data is encrypted and secure
- **Row Level Security** - Database-level user data isolation
- **Authentication** - Secure user sessions with Supabase Auth
- **No Data Sharing** - Your medical information stays private

## 🩺 Medical Disclaimer

**IMPORTANT**: MEDITALK is an AI assistant designed to provide general health information and guidance. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.

- This app provides educational information only
- Not intended for emergency medical situations
- Always call emergency services (911) for urgent medical needs
- Consult healthcare providers for personalized medical advice

## 🤝 Contributing

We welcome contributions to improve MEDITALK! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the existing code style and patterns
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `DATABASE_SETUP.md` for setup instructions
- **Issues**: Report bugs via GitHub issues
- **Community**: Join our Discord for support and discussions

## 🎯 Roadmap

- [ ] Voice input for symptom reporting
- [ ] Integration with wearable devices
- [ ] Appointment scheduling
- [ ] Prescription management
- [ ] Telemedicine video calls
- [ ] Health insights with AI analytics

---

**Built with ❤️ for better healthcare accessibility**

*MEDITALK - Bridging the gap to quality healthcare through AI technology*
