import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import './TeacherDashboard.css';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [quizType, setQuizType] = useState('mcq');
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPdfUploaded, setIsPdfUploaded] = useState(false);
  const fileInputRef = useRef(null);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedQuizAttempts, setSelectedQuizAttempts] = useState([]);
  const [showAttempts, setShowAttempts] = useState(false);
  const [selectedQuizForAttempts, setSelectedQuizForAttempts] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isScrapingWebsite, setIsScrapingWebsite] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    // Fetch teacher's quizzes
    fetchTeacherQuizzes();
  }, [navigate]);

  const fetchTeacherQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/quizzes/teacher', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedQuizzes(response.data);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/');
  };

  const generateQuiz = async () => {
    setError(null);
    
    if (!text.trim()) {
      setError('Please enter some text or upload a PDF to generate a quiz');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/generate-quiz', {
        text: text,
        quiz_type: quizType,
        difficulty: quizDifficulty
      });

      if (!response.data.questions || response.data.questions.length === 0) {
        const errorMessage = response.data.error || 'No questions were generated. Please try again with different text or quiz type.';
        setError(errorMessage);
        setQuestions([]);
      } else {
        setQuestions(response.data.questions);
        setShowSaveForm(true);
      }
    } catch (error) {
      console.error('Quiz generation failed', error);
      setError('Failed to generate quiz. Please try again.');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('http://localhost:8000/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (!response.data.text || response.data.text.trim() === '') {
        const errorMessage = response.data.error || 'No text could be extracted from the PDF. Please try a different file.';
        setError(errorMessage);
        return;
      }
      
      setText(response.data.text);
      setIsPdfUploaded(true);
    } catch (error) {
      console.error('PDF upload failed', error);
      setError('Failed to upload PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebsiteScrape = async (e) => {
    e.preventDefault();
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setIsScrapingWebsite(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:8000/scrape-website', {
        url: websiteUrl
      });

      if (!response.data.text || response.data.text.trim() === '') {
        const errorMessage = response.data.error || 'No text could be extracted from the website. Please try a different URL.';
        setError(errorMessage);
        return;
      }

      setText(response.data.text);
      
      // If metadata is available, use it to pre-fill the quiz title and description
      if (response.data.metadata) {
        const { title, summary } = response.data.metadata;
        if (title) {
          setQuizTitle(title);
        }
        if (summary) {
          setQuizDescription(summary);
        }
      }
      
      setWebsiteUrl('');
    } catch (error) {
      console.error('Website scraping failed:', error);
      setError('Failed to scrape website. Please check the URL and try again.');
    } finally {
      setIsScrapingWebsite(false);
    }
  };

  const clearInput = () => {
    setText('');
    setQuestions([]);
    setError(null);
    setIsPdfUploaded(false);
    setShowSaveForm(false);
    setSaveSuccess(false);
    setAccessCode('');
    setQuizTitle('');
    setQuizDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveQuizToBackend = async () => {
    if (!quizTitle) {
      setError('Please enter a quiz title');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please login again.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8000/quizzes',
        {
          title: quizTitle,
          description: quizDescription,
          questions: questions,
          quiz_type: 'mcq'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setAccessCode(response.data.access_code);
      setSaveSuccess(true);
      setShowSaveForm(false);
      setError('');
      await fetchTeacherQuizzes();
    } catch (err) {
      console.error('Error saving quiz:', err);
      setError(err.response?.data?.detail || 'Failed to save quiz');
    }
  };

  const downloadQuiz = (quizToDownload) => {
    const doc = new jsPDF();
    
    // Set font sizes
    const titleFontSize = 16;
    const questionFontSize = 12;
    const optionFontSize = 10;
    
    // Set initial positions
    let yPos = 20;
    const leftMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = pageWidth - 2 * leftMargin;
    
    // Add title
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(quizToDownload.title || 'Generated Quiz', leftMargin, yPos);
    yPos += 15;
    
    // Process each question
    doc.setFont('helvetica', 'normal');
    quizToDownload.questions.forEach((q, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(questionFontSize);
      doc.setFont('helvetica', 'bold');
      const questionText = `${index + 1}. ${q.text}`;
      
      const splitQuestionText = doc.splitTextToSize(questionText, textWidth);
      doc.text(splitQuestionText, leftMargin, yPos);
      
      yPos += splitQuestionText.length * 7;
      
      if (q.type === 'mcq' && q.options) {
        doc.setFontSize(optionFontSize);
        doc.setFont('helvetica', 'normal');
        
        q.options.forEach((option, optIndex) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          const optionLetter = String.fromCharCode(65 + optIndex);
          const optionText = `${optionLetter}. ${option}`;
          
          const splitOptionText = doc.splitTextToSize(optionText, textWidth - 10);
          doc.text(splitOptionText, leftMargin + 10, yPos);
          
          yPos += splitOptionText.length * 6 + 2;
        });
        
        yPos += 5;
      } else {
        yPos += 15;
      }
    });

    doc.save(`${quizToDownload.title || 'quiz'}.pdf`);
  };

  const viewQuizAttempts = async (quiz) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/quizzes/${quiz._id}/attempts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedQuizAttempts(response.data);
      setSelectedQuizForAttempts(quiz);
      setShowAttempts(true);
    } catch (err) {
      console.error('Error fetching quiz attempts:', err);
      setError('Failed to fetch quiz attempts');
    }
  };

  const closeAttempts = () => {
    setShowAttempts(false);
    setSelectedQuizAttempts([]);
    setSelectedQuizForAttempts(null);
  };

  return (
    <div className="teacher-dashboard">
      <nav className="dashboard-nav">
        <h1>Teacher Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </nav>

      <div className="dashboard-content">
        <div className="quiz-generator-section">
          <h2>Generate New Quiz</h2>
          <div className="input-section">
            <div className="input-methods">
              <div className="input-method">
                <h3>Upload PDF</h3>
                <div className="file-upload">
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileUpload} 
                    ref={fileInputRef}
                    className="file-input"
                  />
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="upload-btn"
                    disabled={isLoading || isScrapingWebsite}
                  >
                    Upload PDF
                  </button>
                </div>
              </div>

              <div className="input-method">
                <h3>Scrape Website</h3>
                <form onSubmit={handleWebsiteScrape} className="website-form">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="Enter website URL"
                    className="website-input"
                    required
                  />
                  <button 
                    type="submit"
                    className="scrape-btn"
                    disabled={isLoading || isScrapingWebsite}
                  >
                    {isScrapingWebsite ? 'Scraping...' : 'Scrape Website'}
                  </button>
                </form>
              </div>
            </div>
            
            <div className="text-input">
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text, upload a PDF, or scrape a website to generate quiz"
                disabled={isPdfUploaded}
              />
              {(isPdfUploaded || text) && (
                <div className="pdf-info">
                  <p>Content loaded successfully! Ready for quiz generation.</p>
                  <button onClick={clearInput} className="clear-btn">Clear</button>
                </div>
              )}
            </div>
          </div>
          
          <div className="quiz-controls">
            <select 
              value={quizType} 
              onChange={(e) => setQuizType(e.target.value)}
              className="select"
            >
              <option value="mcq">Multiple Choice (Single Best Answer)</option>
              <option value="true_false">True/False</option>
              <option value="multi_answer">Multiple Choice (Multiple Correct Answer)</option>
            </select>

            <select
              value={quizDifficulty}
              onChange={(e) => setQuizDifficulty(e.target.value)}
              className="select"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            
            <button 
              onClick={generateQuiz}
              disabled={isLoading}
              className="generate-btn"
            >
              {isLoading ? 'Generating...' : 'Generate Quiz'}
            </button>
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}
        </div>

        {/* Save Quiz Form */}
        {showSaveForm && questions.length > 0 && !saveSuccess && (
          <div className="save-quiz-form">
            <h2>Save Quiz</h2>
            <div className="form-group">
              <label htmlFor="quiz-title">Quiz Title</label>
              <input
                type="text"
                id="quiz-title"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Enter quiz title"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quiz-description">Quiz Description (Optional)</label>
              <textarea
                id="quiz-description"
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                placeholder="Enter quiz description"
              />
            </div>
            <div className="form-actions">
              <button 
                onClick={saveQuizToBackend}
                disabled={isLoading}
                className="save-btn"
              >
                {isLoading ? 'Saving...' : 'Save Quiz'}
              </button>
              <button 
                onClick={clearInput}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Access Code Display */}
        {saveSuccess && accessCode && (
          <div className="access-code-display">
            <h2>Quiz Saved Successfully!</h2>
            <div className="access-code-box">
              <p>Access Code: <span className="access-code">{accessCode}</span></p>
              <p>Share this code with your students to access the quiz.</p>
            </div>
            <button onClick={clearInput} className="new-quiz-btn">
              Generate New Quiz
            </button>
          </div>
        )}

        {/* Display saved quizzes */}
        <div className="saved-quizzes-section">
          <h2>Saved Quizzes</h2>
          <div className="quiz-list">
            {savedQuizzes.map((quiz) => (
              <div key={quiz._id} className="quiz-card">
                <h3>{quiz.title}</h3>
                <p>Type: {quiz.quiz_type.toUpperCase()}</p>
                <p>Questions: {quiz.questions.length}</p>
                <p>Access Code: <span className="access-code">{quiz.access_code}</span></p>
                <p>Created: {new Date(quiz.created_at).toLocaleDateString()}</p>
                <div className="quiz-actions">
                  <button 
                    onClick={() => downloadQuiz(quiz)}
                    className="download-btn"
                  >
                    Download Quiz
                  </button>
                  <button 
                    onClick={() => viewQuizAttempts(quiz)}
                    className="view-attempts-btn"
                  >
                    View Attempts
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiz Attempts Modal */}
        {showAttempts && selectedQuizForAttempts && (
          <div className="attempts-modal">
            <div className="attempts-modal-content">
              <div className="attempts-modal-header">
                <h2>Student Attempts for: {selectedQuizForAttempts.title}</h2>
                <button onClick={closeAttempts} className="close-btn">&times;</button>
              </div>
              <div className="attempts-list">
                {selectedQuizAttempts.length > 0 ? (
                  selectedQuizAttempts.map((attempt, index) => (
                    <div key={attempt._id} className="attempt-card">
                      <h3>Student: {attempt.student_name}</h3>
                      <p>Score: {attempt.score}%</p>
                      <p>Submitted: {new Date(attempt.submitted_at).toLocaleString()}</p>
                      <div className="answer-details">
                        {attempt.answers.map((answer, ansIndex) => (
                          <div key={ansIndex} className="answer-item">
                            <p>Question {ansIndex + 1}:</p>
                            <p className={answer.is_correct ? 'correct' : 'incorrect'}>
                              {answer.is_correct ? '✓' : '✗'} {answer.student_answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-attempts">No attempts yet for this quiz</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Display current quiz questions */}
        {questions.length > 0 && !saveSuccess && (
          <div className="current-quiz-section">
            <h2>Current Quiz Preview</h2>
            <button onClick={() => downloadQuiz({ questions })} className="download-btn">
              Download Current Quiz
            </button>
            {questions.map((q, index) => (
              <div key={index} className="question">
                <p className="question-text">{q.text}</p>
                <div className="options">
                  {q.type === 'mcq' && q.options && (
                    q.options.map((option, optIndex) => (
                      <div key={optIndex} className="option-container">
                        <div className="option">
                          <input 
                            type="radio" 
                            name={`question-${index}`} 
                            id={`option-${index}-${optIndex}`}
                          />
                          <label htmlFor={`option-${index}-${optIndex}`}>
                            {option}
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                  {q.type === 'true_false' && (
                    ['True', 'False'].map((option, optIndex) => (
                      <div key={optIndex} className="option-container">
                        <div className="option">
                          <input 
                            type="radio" 
                            name={`question-${index}`} 
                            id={`option-${index}-${optIndex}`}
                          />
                          <label htmlFor={`option-${index}-${optIndex}`}>
                            {option}
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                  {q.type === 'multi_answer' && q.options && (
                    q.options.map((option, optIndex) => (
                      <div key={optIndex} className="option-container">
                        <div className="option">
                          <input 
                            type="checkbox" 
                            name={`question-${index}`} 
                            id={`option-${index}-${optIndex}`}
                          />
                          <label htmlFor={`option-${index}-${optIndex}`}>
                            {option}
                          </label>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard; 