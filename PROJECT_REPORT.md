# QuizGenerator - Project Report

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Technical Stack](#technical-stack)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Security Implementation](#security-implementation)
8. [Deployment](#deployment)
9. [Future Enhancements](#future-enhancements)

## Project Overview
QuizGenerator is a web application that allows teachers to create quizzes automatically from text content, PDF files, or website content. The application uses AI to generate questions and provides a platform for students to take these quizzes.

### Key Objectives
- Automate quiz generation using AI
- Support multiple question types (MCQ, True/False, Multiple Correct Answers)
- Provide a user-friendly interface for teachers and students
- Enable quiz sharing through access codes
- Track student performance and generate reports

## Architecture
The application follows a client-server architecture:

### Frontend
- Built with React.js
- Uses React Router for navigation
- Implements responsive design
- Supports PDF generation and Excel exports

### Backend
- Built with FastAPI (Python)
- MongoDB database
- RESTful API endpoints
- JWT authentication

## Features

### Teacher Features
1. **Quiz Generation**
   - Text-based quiz generation
   - PDF file upload and extraction
   - Website content scraping
   - Multiple question types support
   - Difficulty level selection

2. **Quiz Management**
   - Save and organize quizzes
   - Generate access codes
   - Preview quizzes before saving
   - Download quizzes as PDF
   - View student attempts

3. **Analytics**
   - View student performance
   - Download attempt reports as Excel
   - Track individual question performance

### Student Features
1. **Quiz Taking**
   - Access quizzes using codes
   - Real-time answer submission
   - Immediate score feedback
   - View attempt history

2. **Progress Tracking**
   - View past attempts
   - Track performance over time
   - Review correct/incorrect answers

## Technical Stack

### Frontend
- React.js
- React Router
- Axios for API calls
- jsPDF for PDF generation
- XLSX for Excel report generation
- CSS for styling

### Backend
- FastAPI (Python)
- MongoDB
- PyPDF2 for PDF processing
- BeautifulSoup for web scraping
- JWT for authentication

### Development Tools
- Git for version control
- VS Code as IDE
- Postman for API testing
- MongoDB Compass for database management

## API Documentation

### Authentication Endpoints
- `POST /token` - User login
- `POST /register` - User registration

### Teacher Endpoints
- `GET /quizzes/teacher` - Get teacher's quizzes
- `POST /generate-quiz` - Generate quiz from text
- `POST /upload-pdf` - Upload and process PDF
- `POST /scrape-website` - Scrape website content
- `POST /quizzes` - Save quiz
- `GET /quizzes/{quiz_id}/attempts` - Get quiz attempts

### Student Endpoints
- `GET /quizzes` - Get available quizzes
- `POST /quizzes/access` - Access quiz with code
- `POST /quizzes/submit` - Submit quiz attempt
- `GET /attempts` - Get student's attempts

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  password_hash: String,
  user_type: String, // 'teacher' or 'student'
  created_at: DateTime
}
```

### Quizzes Collection
```javascript
{
  _id: ObjectId,
  teacher_id: ObjectId,
  title: String,
  description: String,
  questions: [{
    text: String,
    type: String, // 'mcq', 'true_false', 'multi_answer'
    difficulty: String,
    options: [String],
    correct_answer: String, // For MCQ and True/False
    correct_answers: [String] // For multi-answer
  }],
  quiz_type: String,
  access_code: String,
  created_at: DateTime
}
```

### Quiz Attempts Collection
```javascript
{
  _id: ObjectId,
  student_id: ObjectId,
  quiz_id: ObjectId,
  answers: [{
    question_id: String,
    student_answer: String,
    is_correct: Boolean
  }],
  score: Number,
  submitted_at: DateTime
}
```

## Security Implementation

### Authentication
- JWT-based authentication
- Token expiration
- Password hashing using bcrypt
- Role-based access control

### Data Protection
- Input validation
- CORS configuration
- Rate limiting
- Secure headers

### File Upload Security
- File type validation
- Size limits
- Content scanning

## Deployment

### Frontend
- Deployed on Render
- URL: https://quizgenerator-6qge.onrender.com

### Backend
- Deployed on Render
- MongoDB Atlas for database
- Environment variables for configuration

## Future Enhancements

### Planned Features
1. **Advanced Question Types**
   - Fill in the blanks
   - Matching questions
   - Short answer questions

2. **Enhanced Analytics**
   - Detailed performance metrics
   - Class-wide analytics
   - Progress tracking over time

3. **Collaboration Features**
   - Quiz sharing between teachers
   - Question bank creation
   - Template system

4. **Integration Capabilities**
   - LMS integration
   - Google Classroom integration
   - API for third-party applications

### Technical Improvements
1. **Performance Optimization**
   - Caching implementation
   - Database indexing
   - Query optimization

2. **Scalability**
   - Load balancing
   - Database sharding
   - Microservices architecture

3. **User Experience**
   - Mobile app development
   - Offline mode
   - Enhanced accessibility

## Conclusion
QuizGenerator provides a comprehensive solution for automated quiz generation and management. The application successfully combines AI technology with user-friendly interfaces to streamline the quiz creation and assessment process. With its modular architecture and scalable design, it's well-positioned for future enhancements and growth. 