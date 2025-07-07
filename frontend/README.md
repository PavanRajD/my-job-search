# My Job Search – Behavioral Interview Practice App

Welcome! This app helps you practice and improve your answers to behavioral interview questions. You can upload your resume, answer questions, and get feedback powered by Google AI.

## Who is this for?
Anyone preparing for job interviews who wants to:
- Practice answering real interview questions
- Get AI-powered feedback and suggestions
- Build a personal library of answers

No technical skills are needed to run this app!

## How to Get Started (Step by Step)

### 1. Install Docker Desktop
- Download Docker Desktop from [here](https://www.docker.com/products/docker-desktop/).
- Install it and make sure it is running (look for the Docker whale icon on your computer).

### 2. Get the App Code
- Click the green "Code" button on the [GitHub page](https://github.com/your-username/my-job-search) and copy the link.
- Open your computer's Terminal (or Command Prompt on Windows).
- Type these commands:

```bash
git clone https://github.com/your-username/my-job-search.git
cd my-job-search
```

### 3. Set Up Google AI (Gemini)
- Go to [Google Cloud Console](https://console.cloud.google.com/).
- Create a project (or use an existing one).
- Search for "Generative Language API" and enable it.
- Go to **APIs & Services > Credentials** and create an API key.
- Copy your API key.

### 4. Add Your Google API Key
- Open the folder `my-job-search/backend`.
- Find the file named `.env` (it is already created for you).
- Open `.env` with Notepad or any text editor.
- Find the line that says:

```
GOOGLE_API_KEY=
```

- Paste your Google API key after the `=` sign, like this:

```
GOOGLE_API_KEY=your_google_gemini_api_key_here
```

- Save the file.

### 5. Start the App
- In your Terminal, make sure you are in the `my-job-search` folder.
- Type this command to start everything:

```bash
docker-compose up --build
```

- Wait a few minutes. When it says the frontend is running, open your web browser and go to:

[http://localhost:5173](http://localhost:5173)

- You can now use the app!

### 6. Stopping the App
- When you are done, go back to your Terminal and press `Ctrl+C` to stop.
- To fully shut down and clean up, type:

```bash
docker-compose down
```

---

**That's it!**
- You do not need to install anything else.
- You do not need to run any other commands.
- Just update the `.env` file if you ever need to change your Google API key.

If you have any trouble, ask someone to help you with Docker or Google Cloud setup.

---

**Note:** Resume tailoring features are coming soon!
