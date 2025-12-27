# Events Platform

A full-stack event management platform with Django REST Framework backend and React frontend. Features role-based access control, OTP authentication, and comprehensive event management capabilities.

## Overview

Events Platform is a modern web application that enables users to discover, create, and manage events. The platform supports two distinct user roles:

- **Seekers**: Users who can browse events, search with filters, and enroll in events
- **Facilitators**: Event organizers who can create, update, and manage their own events

The system features secure OTP-based email authentication, JWT token management, automatic capacity tracking, and a responsive React interface.

## Tech Stack

### Backend
- **Framework**: Django 4.2.8 with Django REST Framework 3.14.0
- **Authentication**: JWT (djangorestframework-simplejwt 5.3.1) with OTP-based email verification
- **Database**: SQLite (development) / PostgreSQL (production recommended)
- **Email**: SMTP (Gmail configured)
- **Key Libraries**:
  - `django-cors-headers` - CORS handling
  - `python-decouple` - Environment configuration

### Frontend
- **Framework**: React 18.2.0 with Vite 5.0.8
- **Routing**: React Router DOM 6.20.1
- **HTTP Client**: Axios 1.6.2
- **Styling**: Tailwind CSS 3.3.6
- **Build Tool**: Vite (fast HMR and optimized builds)

## Setup

### Prerequisites

- Python 3.8 or higher
- Node.js 16+ and npm
- PostgreSQL 12+ (for production) or SQLite (default for development)
- Gmail account with App Password (for email OTP)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ahoum/backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   
   Copy `.env.example` to `.env` and configure:
   ```env
   # Django Settings
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   
   # Email Configuration (Gmail)
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-gmail-app-password
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   
   # CORS Settings
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
   
   # JWT Settings (optional)
   SIMPLE_JWT_ACCESS_TOKEN_LIFETIME=15
   SIMPLE_JWT_REFRESH_TOKEN_LIFETIME=1440
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start backend server**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://127.0.0.1:8000/`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment (optional)**
   
   Create `.env` file if you need custom API URL:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173/`

### Gmail App Password Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings → Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password (remove spaces)
6. Use this password in `EMAIL_HOST_PASSWORD` in `.env`

## API Summary

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup/` | Register new user - sends OTP to email | No |
| POST | `/api/auth/verify-email/` | Verify OTP and activate account | No |
| POST | `/api/auth/resend-otp/` | Resend OTP code | No |
| POST | `/api/auth/login/` | Login with email and password | No |
| POST | `/api/auth/refresh/` | Refresh JWT access token | No |

### Event Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/events/` | List all events with pagination | Optional | All |
| POST | `/api/events/` | Create new event | Yes | Facilitator |
| GET | `/api/events/{id}/` | Get event details | Optional | All |
| PUT/PATCH | `/api/events/{id}/` | Update event | Yes | Facilitator (owner) |
| DELETE | `/api/events/{id}/` | Delete event | Yes | Facilitator (owner) |
| GET | `/api/events/mine/` | Get facilitator's own events | Yes | Facilitator |
| POST | `/api/events/{id}/enroll/` | Enroll in event | Yes | Seeker |

**Query Parameters:**
- `page` - Page number for pagination

### Enrollment Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/events/enrollments/my-enrollments/` | Get user's enrollments | Yes | Seeker |

## Frontend Features

### Pages and Routes

- **Public Routes**
  - `/signup` - User registration with OTP verification
  - `/verify-otp` - Email verification with 6-digit code
  - `/login` - User authentication

- **Seeker Routes** (Protected)
  - `/events` - Browse and search all events
  - `/events/:id` - View event details and enroll
  - `/my-enrollments` - View enrolled events

- **Facilitator Routes** (Protected)
  - `/events` - Browse all events
  - `/create-event` - Create new event
  - `/my-events` - Manage own events
  - `/edit-event/:id` - Edit/delete events

### Key Components

- **AuthContext**: JWT token management with automatic refresh
- **ProtectedRoute**: Role-based route protection
- **Axios Interceptor**: Automatic token refresh on 401 errors with request queuing
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Design Decisions

### 1. **OTP-Based Email Authentication**

Instead of traditional email verification links, we implemented OTP (One-Time Password) for several reasons:
- **Better UX**: Users can complete signup without leaving the app
- **Time-bound security**: OTPs expire after 10 minutes
- **Reduced friction**: No need to check email and click links
- OTPs are 6-digit numeric codes stored securely with hashing

### 2. **JWT Token Authentication**

We chose JWT over session-based authentication because:
- **Stateless**: No server-side session storage required
- **Scalability**: Easier to scale horizontally
- **Mobile-friendly**: Tokens work seamlessly with mobile apps
- **Refresh token pattern**: Balance between security and user experience
  - Access tokens: 60 minutes lifetime
  - Refresh tokens: 24 hours lifetime

### 3. **Role-Based Access Control (RBAC)**

Two distinct roles (Seeker and Facilitator) provide:
- **Clear separation of concerns**: Different capabilities for different user types
- **Permission-based views**: Custom permissions for each role
- **Flexible**: Easy to add more roles in the future
- **Role selection during signup**: Users choose their role upfront

### 4. **Event Capacity Management**

Automatic capacity tracking ensures:
- **Real-time availability**: Capacity checks before enrollment
- **Data integrity**: Database-level constraints prevent over-enrollment
- **Atomic operations**: Race condition handling with transactions
- **Waitlist-ready**: Architecture supports future waitlist feature

### 5. **Search and Filtering**

Comprehensive search implementation:
- **Full-text search**: Uses PostgreSQL's text search capabilities
- **Multiple filters**: Category, location, date range
- **Performance**: Indexed fields for fast queries
- **Pagination**: Configurable page sizes (default 10, max 100)

### 6. **SQLite for Development, PostgreSQL for Production**

Database strategy:
- **Development**: SQLite for simplicity and zero configuration
- **Production**: PostgreSQL for ACID compliance and scalability
- **Full-text search**: Ready for PostgreSQL's text search capabilities
- **Easy migration**: Django ORM abstracts database differences

### 7. **API Design Principles**

- **RESTful conventions**: Standard HTTP methods and status codes
- **Consistent response format**: Uniform JSON structure
- **Comprehensive error handling**: Detailed error messages
- **API versioning ready**: Structure supports future versions
- **CORS enabled**: Ready for frontend integration

### 8. **Security Measures**

- **Password hashing**: bcrypt with Django's PBKDF2
- **Rate limiting**: Prevents brute force attacks (configurable)
- **Environment variables**: Sensitive data in .env files
- **HTTPS ready**: Secure headers configuration
- **Input validation**: DRF serializers validate all inputs

### 9. **Code Organization**

- **App-based structure**: Separate apps for users, events, enrollments
- **Custom permissions**: Reusable permission classes
- **Service layer pattern**: Business logic separated from views
- **DRY principle**: Reusable serializers and mixins

### 10. **Future Extensibility**

The architecture supports future enhancements:
- Event categories and tags
- Event reviews and ratings
- Notification system for reminders
- Payment integration for paid events
- Social features (likes, shares, comments)
- Advanced analytics for facilitators
- Email notification system
- Event recommendations based on user preferences

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue in the repository.
