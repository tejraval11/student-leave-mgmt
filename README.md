# Leave Management System

A comprehensive leave management system for educational institutions built with Next.js, Prisma, and NextAuth.

## Features

### 🎯 Core Features
- **Role-based Authentication**: Students, Faculty, Parents, and Admins
- **Leave Application Management**: Submit, approve, reject, and track leave requests
- **Email Notifications**: Automated email notifications using Nodemailer
- **Real-time Updates**: Instant notifications for all stakeholders
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS

### 👥 User Roles

#### Student
- Apply for leave with detailed forms
- Track application status
- View leave history
- Cancel pending applications
- Receive email notifications

#### Faculty
- Review pending leave applications
- Approve or reject requests with comments
- View student leave history
- Track approval statistics

#### Parent
- Receive notifications for child's leave requests
- Approve or reject leave applications
- View child's leave history
- Monitor attendance (future feature)

#### Admin
- Full system access
- User management
- System analytics and reports

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leave-mgmt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/leave_mgmt"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # Email (Nodemailer)
   EMAIL_SERVER_HOST="smtp.gmail.com"
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER="your-email@gmail.com"
   EMAIL_SERVER_PASSWORD="your-app-password"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Seed the database with sample data
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Sample Login Credentials

After running the seed script, you can use these credentials:

- **Student**: `student@example.com` / `password123`
- **Faculty**: `faculty@example.com` / `password123`
- **Parent**: `parent@example.com` / `password123`
- **Admin**: `admin@example.com` / `password123`

## 🏗️ Project Structure

```
leave-mgmt/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth configuration
│   │   ├── leave/         # Leave management APIs
│   │   └── notifications/ # Notification APIs
│   ├── auth/              # Authentication pages
│   ├── student/           # Student dashboard & pages
│   ├── faculty/           # Faculty dashboard & pages
│   ├── parent/            # Parent dashboard & pages
│   └── admin/             # Admin dashboard & pages
├── lib/                   # Utility libraries
│   ├── prisma.js          # Prisma client
│   └── email.js           # Email service
├── prisma/                # Database schema & migrations
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Database seed script
└── middleware.js          # NextAuth middleware
```

## 🗄️ Database Schema

The system uses the following main entities:

- **User**: Base user table with authentication
- **Student**: Student-specific information
- **Parent**: Parent information
- **Faculty**: Faculty member information
- **LeaveApplication**: Leave request details
- **LeaveHistory**: Audit trail for leave actions
- **Notification**: System notifications

## 🔧 Configuration

### Email Setup
To enable email notifications, configure your email provider in the `.env` file:

```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
```

For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in EMAIL_SERVER_PASSWORD

### Database Setup
The system uses PostgreSQL. You can use:
- Local PostgreSQL installation
- Cloud providers like Supabase, Railway, or Neon
- Docker container

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Features

- **Role-based Access Control**: Middleware protects routes based on user roles
- **Password Hashing**: bcryptjs for secure password storage
- **Session Management**: NextAuth.js handles secure sessions
- **Input Validation**: Server-side validation for all forms
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

## 📧 Email Templates

The system includes pre-built email templates for:
- Leave application submitted
- Leave application approved
- Leave application rejected
- Parent approval required
- Parent approval/rejection notifications

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client

### Adding New Features
1. Update the Prisma schema if needed
2. Create API routes in `app/api/`
3. Build UI components
4. Add proper validation and error handling
5. Update tests (if applicable)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🔮 Future Enhancements

- [ ] SMS notifications using Twilio
- [ ] File upload for supporting documents
- [ ] Advanced reporting and analytics
- [ ] Mobile app
- [ ] Integration with attendance systems
- [ ] Bulk leave approval
- [ ] Calendar integration
- [ ] Multi-language support
