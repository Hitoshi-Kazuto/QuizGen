import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Main TestifyAI Component
const QuizGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [quizType, setQuizType] = useState('mcq');
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateQuiz = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, you'd call your backend API here
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          quizType: quizType
        })
      });

      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>TestifyAI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea 
              placeholder="Paste your text here to generate a quiz"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[200px]"
            />
            
            <div className="flex space-x-4">
              <Select onValueChange={setQuizType} value={quizType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Quiz Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="short">Short Answer</SelectItem>
                  <SelectItem value="long">Long Answer</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={generateQuiz} 
                disabled={!inputText || isLoading}
                className="flex-grow"
              >
                {isLoading ? 'Generating...' : 'Generate Quiz'}
              </Button>
            </div>

            {questions.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">Generated Quiz</h2>
                {questions.map((question, index) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Difficulty: {question.difficulty}</span>
                        <span className="text-sm text-gray-600">
                          {question.type === 'mcq' ? 'Multiple Choice' : 
                           question.type === 'short' ? 'Short Answer' : 'Long Answer'}
                        </span>
                      </div>
                      <p className="font-medium">{question.text}</p>
                      {question.type === 'mcq' && (
                        <div className="mt-2 space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center">
                              <input 
                                type="radio" 
                                name={`question-${index}`} 
                                id={`option-${index}-${optIndex}`} 
                                className="mr-2"
                              />
                              <label htmlFor={`option-${index}-${optIndex}`}>{option}</label>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizGenerator;