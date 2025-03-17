import os
import random
import PyPDF2
from flask import Flask, request, jsonify, send_file, render_template
from transformers import pipeline
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

generator = pipeline('text-generation', model='distilgpt2')

def extract_text_from_pdf(pdf_path):
    text = ""
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfFileReader(file)
        for page_num in range(reader.numPages):
            text += reader.getPage(page_num).extract_text()
    return text

def generate_quiz(text, difficulty, quiz_type, num_questions=5):
    prompt = f"Generate a {quiz_type} quiz with {num_questions} questions on the topic: {text} with difficulty level: {difficulty}.\nQ1:"
    response = generator(prompt, max_length=500, num_return_sequences=1)
    quiz_text = response[0]['generated_text']
    questions = quiz_text.split('\n')
    quiz = []
    for question in questions:
        if question.startswith('Q'):
            quiz.append(question.strip())
    return quiz

def save_quiz_as_pdf(quiz, output_path):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    y = height - 40
    for i, question in enumerate(quiz):
        c.drawString(30, y, f"Question {i + 1}: {question}")
        y -= 20
        if y < 40:
            c.showPage()
            y = height - 40
    c.save()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return '', 204  # No content response

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    difficulty = request.form['difficulty']
    quiz_type = request.form['quiz_type']
    
    if file and file.filename.endswith('.pdf'):
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)
        text = extract_text_from_pdf(file_path)
    elif file and file.filename.endswith('.txt'):
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(file_path)
        with open(file_path, 'r') as f:
            text = f.read()
    else:
        return jsonify({'error': 'Invalid file format'}), 400

    quiz = generate_quiz(text, difficulty, quiz_type)
    return jsonify({'quiz': quiz})

if __name__ == '__main__':
    app.run(debug=True)