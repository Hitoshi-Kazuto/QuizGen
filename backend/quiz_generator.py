import os
import json
import google.generativeai as genai
import re

class QuizGenerator:
    def __init__(self, text: str):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.text = text
        # Try using a different model that might be better suited for structured output
        self.model = genai.GenerativeModel('gemini-1.5-pro')
        # Fallback model
        self.fallback_model = genai.GenerativeModel('gemini-2.0-flash')

    def generate_quiz_prompt(self, quiz_type: str):
        # Create a more structured prompt
        return f"""
        You are a quiz generator. Your task is to create a quiz based on the following text:

        TEXT:
        {self.text}

        INSTRUCTIONS:
        1. Generate exactly 10 questions based on the text above.
        2. Each question must include:
           - A clear, concise question text
           - A difficulty level (easy, medium, or hard)
           - The question type: {quiz_type}
        3. For multiple choice questions (MCQ), provide exactly 4 options.
        4. Ensure questions cover different aspects of the text.
        5. Make sure the questions are relevant to the content.

        FORMAT:
        Return your response as a valid JSON array with the following structure:
        [
          {{
            "text": "Question text here",
            "type": "{quiz_type}",
            "difficulty": "easy/medium/hard",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
          }},
          // More questions...
        ]

        IMPORTANT:
        - Return ONLY the JSON array, with no additional text before or after.
        - Ensure the JSON is properly formatted and valid.
        - If you cannot generate questions, return an empty array [].
        """

    def parse_response(self, response_text):
        """Parse the response text and extract valid questions"""
        print("Parsing response:", response_text[:100] + "..." if len(response_text) > 100 else response_text)
        
        # Try to extract JSON from the response if it's not directly parseable
        json_match = re.search(r'\[\s*\{.*\}\s*\]', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            print("Extracted JSON string:", json_str[:100] + "..." if len(json_str) > 100 else json_str)
            
            try:
                questions = json.loads(json_str)
                print(f"Successfully parsed extracted JSON. Type: {type(questions)}")
                return questions
            except json.JSONDecodeError as e:
                print(f"Failed to parse extracted JSON: {e}")
                return []
        else:
            print("No JSON array pattern found in response")
            return []

    def validate_questions(self, questions):
        """Validate the questions and return only valid ones"""
        if not isinstance(questions, list):
            print(f"Response is not a list of questions. Type: {type(questions)}")
            return []
        
        # Additional validation
        validated_questions = []
        for q in questions:
            if not q.get('text'):
                print("Question skipped due to missing 'text':", q)  # Log skipped questions
                continue
            validated_questions.append(q)
        
        # Log the validated questions
        print(f"Validated Questions: {len(validated_questions)} questions found")
        if validated_questions:
            print("First question sample:", validated_questions[0])

        return validated_questions

    def generate_quiz(self, quiz_type: str = 'mcq'):
        prompt = self.generate_quiz_prompt(quiz_type)
        try:
            print(f"Generating quiz with type: {quiz_type}")
            print(f"Input text length: {len(self.text)}")
            
            # Increase safety settings to handle potential content issues
            generation_config = {
                'temperature': 0.7,
                'max_output_tokens': 2048  # Increased token limit
            }
            
            # Try with the primary model first
            try:
                print("Trying with primary model (gemini-1.5-pro)...")
                response = self.model.generate_content(
                    prompt, 
                    generation_config=generation_config
                )
                
                # Print raw response for debugging
                print("Raw Gemini Response:", response.text)
                print("Response type:", type(response.text))
                
                # Parse and validate the response
                questions = self.parse_response(response.text)
                validated_questions = self.validate_questions(questions)
                
                if validated_questions:
                    return validated_questions
                
                print("Primary model failed to generate valid questions, trying fallback model...")
            except Exception as e:
                print(f"Error with primary model: {e}")
                print("Trying fallback model...")
            
            # If primary model fails, try with the fallback model
            try:
                response = self.fallback_model.generate_content(
                    prompt, 
                    generation_config=generation_config
                )
                
                # Print raw response for debugging
                print("Raw Fallback Model Response:", response.text)
                
                # Parse and validate the response
                questions = self.parse_response(response.text)
                validated_questions = self.validate_questions(questions)
                
                if validated_questions:
                    return validated_questions
                
                print("Fallback model also failed to generate valid questions.")
            except Exception as e:
                print(f"Error with fallback model: {e}")
            
            print("No valid questions generated from either model.")
            return []
        
        except Exception as e:
            print(f"Error in quiz generation: {e}")
            return []