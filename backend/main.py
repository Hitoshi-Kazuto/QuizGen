from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from quiz_generator import QuizGenerator
import PyPDF2
import io
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Quiz Generator API is running"}

class QuizRequest(BaseModel):
    text: str
    quiz_type: str = 'mcq'


@app.post("/generate-quiz")
async def generate_quiz(request: QuizRequest):
    print(f"Received text: {request.text[:100]}...")  # Log first 100 chars
    print(f"Text length: {len(request.text)}")
    print(f"Quiz type: {request.quiz_type}")
    
    # Validate text
    if not request.text or not request.text.strip():
        print("Empty text received")
        return {"questions": [], "error": "Text cannot be empty"}
    
    # Clean and prepare text
    cleaned_text = request.text.strip()
    
    try:
        generator = QuizGenerator(cleaned_text)
        questions = generator.generate_quiz(request.quiz_type)
        
        print(f"Generated questions: {len(questions)}")
        
        if not questions:
            print("No questions were generated. Returning empty array.")
            return {"questions": [], "error": "No questions could be generated from the provided text"}
        
        return {"questions": questions}
    except Exception as e:
        print(f"Error in generate_quiz endpoint: {e}")
        return {"questions": [], "error": str(e)}


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        pdf_content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        print(f"Extracted text length: {len(text)}")
        
        if not text.strip():
            print("No text extracted from PDF")
            return {"text": "", "error": "No text could be extracted from the PDF"}
        
        return {"text": text}
    except Exception as e:
        print(f"Error in upload_pdf endpoint: {e}")
        return {"text": "", "error": str(e)}