# PreAid - Your Personal Health Companion 🏥

A modern, AI-powered health assistant with user authentication and persistent history storage. Built with a human-centered design approach.

## ✨ Features

- **🤖 AI Health Advice**: Powered by Google Gemini 1.5-Flash
- **👤 User Authentication**: Secure login/register system
- **🎭 Guest Mode**: Try without creating an account
- **📱 Modern UI**: Human-friendly design with dark/light themes
- **🎤 Voice Input**: Speak your symptoms naturally
- **📋 History Management**: Save and access past consultations
- **🔒 Secure**: JWT authentication with encrypted passwords
- **☁️ Cloud Ready**: Deployed on Vercel with PostgreSQL

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd preaid-health-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   JWT_SECRET=your_jwt_secret
   POSTGRES_URL=your_postgres_url
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🌐 Deployment Guide

### Step 1: Prepare Your Code

1. **Update .env file**
   ```bash
   GEMINI_API_KEY=AIzaSyCAb-9yrnwpS4JwrRnfC2uXJtBJo5eKcMA
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   ```

### Step 2: GitHub Setup

1. **Initialize Git repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: PreAid Health Assistant v2.0"
   ```

2. **Create GitHub repository**
   - Go to [GitHub](https://github.com)
   - Click "New repository"
   - Name: `preaid-health-assistant`
   - Make it public or private
   - Don't initialize with README (we already have one)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/preaid-health-assistant.git
   git branch -M main
   git push -u origin main
   ```

### Step 3: Vercel Deployment

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select "preaid-health-assistant"

3. **Configure Environment Variables**
   In Vercel dashboard:
   - Go to Settings → Environment Variables
   - Add these variables:
     ```
     GEMINI_API_KEY = AIzaSyCAb-9yrnwpS4JwrRnfC2uXJtBJo5eKcMA
     JWT_SECRET = your-super-secret-jwt-key-min-32-chars
     ```

4. **Set up Database**
   - In Vercel dashboard, go to Storage
   - Create new PostgreSQL database
   - Copy the connection string
   - Add as environment variable:
     ```
     POSTGRES_URL = your_postgres_connection_string
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-app-name.vercel.app`

### Step 4: Post-Deployment

1. **Test the application**
   - Visit your Vercel URL
   - Try guest mode
   - Create an account
   - Test health advice functionality

2. **Custom Domain (Optional)**
   - In Vercel dashboard, go to Settings → Domains
   - Add your custom domain

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic structure
- **CSS3** - Modern styling with CSS variables
- **JavaScript (ES6+)** - Vanilla JS, no frameworks
- **Fonts**: Inter & Poppins from Google Fonts
- **Icons**: Emoji-based for human touch

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Database
- **PostgreSQL** - Relational database
- **Vercel Postgres** - Managed database service

### AI/API
- **Google Gemini 1.5-Flash** - AI model
- **Generative Language API** - Google's AI endpoint

### Deployment
- **Vercel** - Serverless hosting
- **GitHub** - Version control

## 📱 Features Overview

### Authentication System
- **Sign Up**: Create account with email/password
- **Sign In**: Secure login with JWT tokens
- **Guest Mode**: Use without account (session-only history)
- **Logout**: Secure session termination

### Health Assistant
- **Natural Language**: Describe symptoms in your own words
- **Voice Input**: Speak your concerns using Web Speech API
- **AI Analysis**: Powered by Google Gemini for accurate advice
- **Empathetic Responses**: Human-like, caring communication

### History Management
- **Persistent Storage**: Save consultations to database
- **Quick Access**: View and reuse past queries
- **Privacy**: User-specific data isolation

### Modern UX
- **Responsive Design**: Works on all devices
- **Dark/Light Theme**: Automatic and manual switching
- **Accessibility**: ARIA labels and keyboard navigation
- **Performance**: Optimized loading and interactions

## 🔒 Security Features

- **Password Encryption**: bcrypt hashing
- **JWT Authentication**: Secure token-based auth
- **Environment Variables**: Sensitive data protection
- **Input Validation**: XSS and injection prevention
- **HTTPS**: Secure data transmission

## 📄 License

MIT License - feel free to use for personal and commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review deployment logs in Vercel dashboard

---

**⚠️ Medical Disclaimer**: This application provides AI-generated health information for educational purposes only. Always consult qualified healthcare professionals for medical advice, diagnosis, or treatment.