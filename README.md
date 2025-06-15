# QuizMaster - Interactive Quiz Platform

A modern, full-stack quiz application built with Next.js 15 and Supabase that allows users to create, share, and take engaging quizzes.

## Features

### 🎯 Core Features
- **Multiple Question Types**: Support for multiple choice, true/false, and short answer questions
- **Quiz Creation**: Intuitive interface for creating quizzes with different question types
- **Public Sharing**: Publish quizzes for anyone to take
- **Real-time Results**: Instant scoring and detailed feedback
- **User Authentication**: Secure sign-up and sign-in functionality
- **Responsive Design**: Works perfectly on desktop and mobile devices

### 🚀 Advanced Features
- **Quiz Management**: Personal dashboard to manage created quizzes
- **Draft System**: Save quizzes as drafts before publishing
- **Analytics**: Track quiz performance and user responses
- **Modern UI**: Clean, professional design with Tailwind CSS
- **Type Safety**: Full TypeScript support with strict typing

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Supabase (PostgreSQL database, Authentication, Real-time)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd quiz-page
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set up the Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` into the editor
4. Run the SQL to create all necessary tables and policies

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses the following main tables:

- **quizzes**: Stores quiz metadata (title, description, type, publish status)
- **questions**: Individual quiz questions with their types and order
- **answer_options**: Multiple choice and true/false answer options
- **quiz_responses**: User quiz attempts and scores  
- **question_responses**: Individual question answers and correctness

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── create/            # Quiz creation
│   ├── dashboard/         # User dashboard
│   ├── quiz/              # Quiz taking interface
│   └── quizzes/           # Quiz listing
├── components/            # Reusable React components
│   └── Navigation.tsx     # Main navigation
└── lib/                   # Utility functions and configurations
    ├── supabase.ts        # Supabase client
    ├── auth.ts            # Authentication helpers
    └── database.types.ts  # TypeScript types
```

## Usage Guide

### Creating a Quiz

1. **Sign up** for an account or **sign in**
2. Click **"Create Quiz"** in the navigation
3. Fill in quiz details (title, description, type)
4. Add questions by clicking **"Add Question"**
5. For each question:
   - Enter the question text
   - Select question type (multiple choice, true/false, short answer)
   - Add answer options and mark correct answers
6. **Save as draft** or **publish** immediately

### Taking a Quiz

1. Browse available quizzes on the **"Browse Quizzes"** page
2. Click **"Take Quiz"** on any published quiz
3. Answer questions using the navigation controls
4. Submit when complete to see your score and results

### Managing Quizzes

1. Access your **Dashboard** to see all created quizzes
2. Edit, publish/unpublish, or delete quizzes
3. View analytics and response data
4. Track quiz performance over time

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

### Environment Variables

Make sure to set these in your deployment environment:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security Features

- **Row Level Security (RLS)**: All database tables have proper RLS policies
- **Authentication**: Secure user authentication via Supabase Auth
- **Data Validation**: Input validation on both client and server side
- **Privacy**: Users can only edit their own quizzes

## Performance Optimizations

- **Static Generation**: Pages are statically generated where possible
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Built-in Next.js image optimization
- **Database Indexing**: Proper indexes for optimal query performance

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure your Supabase URL and key are correct
2. **RLS Policies**: Make sure you've run the complete schema with all policies
3. **Authentication**: Check that email confirmation is properly configured in Supabase

### Getting Help

- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [Supabase documentation](https://supabase.com/docs)
- Open an issue in the repository for bugs or feature requests

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

- [ ] Quiz templates and categories
- [ ] Advanced analytics and reporting
- [ ] Quiz sharing via social media
- [ ] Timer-based quizzes
- [ ] Collaborative quiz creation
- [ ] Export quiz results to CSV
- [ ] Mobile app version

---

Built with ❤️ using Next.js and Supabase
