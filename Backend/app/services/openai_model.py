import time
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_openai import ChatOpenAI
import os

api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

llm = ChatOpenAI(
    model="gpt-4o",  # Updated to latest model
    temperature=0.3,
    max_tokens=8000,
    api_key=api_key
)


def gen_model(prompt):
    """Generate a response using LangChain for better performance"""
    try:
        start_time = time.time()

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are a resume analysis specialist that extracts structured information from resumes and returns it as valid JSON. Only respond with valid JSON, no explanations or extra text."),
            ("user", "{input}")
        ])

        parser = JsonOutputParser()
        chain = prompt_template | llm | parser
        result = chain.invoke({"input": prompt})

        print(f"LangChain API call completed in {time.time() - start_time:.2f} seconds")

        if not isinstance(result, dict):
            raise ValueError("Response is not a valid JSON object")

        return result

    except Exception as e:
        print(f"Error in gen_model: {str(e)}")
        print(f"Prompt: {prompt[:200]}...")
        raise
