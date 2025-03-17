import os
import json
import google.generativeai as genai

class QuizGenerator:
    def __init__(self, text: str):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.text = text
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def generate_quiz_prompt(self, quiz_type: str):
        return f"""
        Strictly follow these instructions to generate a quiz:
        1. Input Text: {self.text}
        2. Generate exactly 10 questions
        3. Each question must have:
           - Clear, concise text
           - Difficulty level (easy/medium/hard)
           - Question type: {quiz_type}
        4. For MCQ, provide 4 options
        5. Ensure questions cover different aspects of the text

        Output EXACTLY in this JSON format:
        [
          {{
            "text": "Question text here",
            "type": "{quiz_type}",
            "difficulty": "easy/medium/hard",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"] (only for MCQ)
          }}
        ]

        Important: If you cannot generate questions, return an empty array.
        """

    def generate_quiz(self, quiz_type: str = 'mcq'):
        prompt = self.generate_quiz_prompt(quiz_type)
        try:
            # Increase safety settings to handle potential content issues
            generation_config = {
                'temperature': 0.7,
                'max_output_tokens': 1024
            }
            
            response = self.model.generate_content(
                prompt, 
                generation_config=generation_config
            )

            # Print raw response for debugging
            print("Raw Gemini Response:", response.text)

            # Attempt to parse the response
            try:
                # Try to parse the response as JSON
                questions = json.loads(response.text)
                
                # Validate the questions
                if not isinstance(questions, list):
                    print("Response is not a list of questions")
                    return []
                
                # Additional validation
                validated_questions = []
                for q in questions:
                    if not q.get('text'):
                        print("Question skipped due to missing 'text':", q)  # Log skipped questions
                        continue
                    validated_questions.append(q)
                
                # Log the validated questions
                print("Validated Questions:", validated_questions)

                if not validated_questions:
                    print("No valid questions generated.")
                return validated_questions
            
            except json.JSONDecodeError:
                # If JSON parsing fails, print the response
                print("Failed to parse JSON. Response was:")
                print(response.text)
                return []
        
        except Exception as e:
            print(f"Error in quiz generation: {e}")
            return []