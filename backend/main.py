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
    print(f"Quiz type: {request.quiz_type}")
    
    generator = QuizGenerator(request.text)
    questions = generator.generate_quiz(request.quiz_type)
    
    print(f"Generated questions: {len(questions)}")
    
    return {"questions": questions}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    pdf_content = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
    
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    
    return {"text": text}