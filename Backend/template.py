import os

def create_fastapi_project(project_name):
    # Create project directories
    os.makedirs(f"{project_name}/app")
    
    # Create main.py
    main_content = '''from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}'''
    
    with open(f"{project_name}/app/main.py", "w") as f:
        f.write(main_content)
    
    # Create __init__.py
    with open(f"{project_name}/app/__init__.py", "w") as f:
        f.write("")
    
    # Create requirements.txt
    requirements = '''fastapi
uvicorn'''
    
    with open(f"{project_name}/requirements.txt", "w") as f:
        f.write(requirements)

if __name__ == "__main__":
    project_name = input("Enter project name: ")
    create_fastapi_project(project_name)
    print(f"\nFastAPI project '{project_name}' created successfully!")
    print("\nTo start:")
    print(f"1. cd {project_name}")
    print("2. pip install -r requirements.txt")
    print("3. uvicorn app.main:app --reload")