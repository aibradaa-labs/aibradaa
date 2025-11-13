# AI Bradaa - The "Explain Like I'm 5" Setup Guide

**Purpose:** This is your personal, step-by-step guide to getting the AI Bradaa project running on your computer. No technical knowledge is needed. Just follow the steps exactly.

---

### **Part 1: The Secret Notebook (`.env` file)**

Every application needs a secret place to keep its passwords and keys. In our project, this is a simple text file named `.env`.

**Why it's important:** This file is like the secret notebook where you write down the address to your house and the keys to your doors. Without it, the app is lost and can't open anything. It's the most important file for getting started.

**Your Action:**

1.  In your project folder, find the file named `.env.example`.
2.  Make a copy of this file and rename the copy to just `.env`.

You now have your own secret notebook.

---

### **Part 2: Getting Your Secret Keys**

Now, we need to fill the notebook with the right secrets.

#### **1. The Database Address (Your App's Memory)**

*   **What it is:** This is the secret address to our online database, where the app stores all its information.
*   **Your Action:**
    1.  Go to [https://neon.tech](https://neon.tech) and sign in.
    2.  Find your project.
    3.  On the dashboard, find the "Connection String" and copy it. It will look like `postgresql://...`.
    4.  In your `.env` file, find the line that says `DATABASE_URL=...` and paste your connection string there.

#### **2. The AI Engine Key (Your App's Power)**

*   **What it is:** This is the master password that lets our app use the powerful AI models from OpenRouter.
*   **Your Action:**
    1.  Go to [https://openrouter.ai/](https://openrouter.ai/) and sign in.
    2.  Go to the "Keys" section and copy the key you created.
    3.  In your `.env` file, find the line that says `OPENROUTER_API_KEY=...` and paste your key there.

#### **3. The App's Own Secret Keys (The Locks on the Doors)**

*   **What it is:** The app needs its own secret passwords to keep user accounts safe.
*   **Your Action:** We will ask your computer to generate a very strong, random password for us.
    1.  **Open your terminal.** This is the black window where you type commands.
    2.  **Type `powershell` and press Enter.** This makes sure your terminal is speaking the right language. The line should now start with `PS`.
    3.  **Copy and paste this exact command** and press Enter:
        ```powershell
        [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
        ```
    4.  **The terminal will spit out a long, random string of characters.** This is your new secret key. Copy it.
    5.  **Paste this same key in TWO places** in your `.env` file:
        *   `JWT_SECRET=`
        *   `SESSION_SECRET=`

---

### **Part 3: Installing the Project's Tools**

*   **What it is:** Our project is like a big Lego set. It needs a lot of standard pieces to be put together. This step automatically downloads and installs all of those pieces.
*   **Your Action:**
    1.  In your terminal, make sure you are in the project folder.
    2.  Type this command and press Enter:
        ```
        npm install
        ```
    3.  Wait for it to finish. It might take a few minutes.

---

### **Part 4: Starting the Application**

*   **What it is:** This is the final step. This command tells your computer to start the application so you can see it in your web browser.
*   **Your Action:**
    1.  In your terminal, type this command and press Enter:
        ```
        npm run dev
        ```
    2.  The terminal will show some text and then tell you that the server is running at `http://localhost:3000`.
    3.  **Open your web browser and go to that address.** You should now see the AI Bradaa application running!

You are now fully set up.
