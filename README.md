# Kabakal Gym Management System

Welcome to the Kabakal Gym Management System! This document serves as a high-level guide for stakeholders, project managers, and new developers to understand the structure and internal workings of our application.

## 🏗️ System Overview

The system is split into two main parts:
1. **Frontend**: The user interface where gym members, staff, and admins interact with the system. Built with React and Vite.
2. **Backend**: The central nervous system (API) that processes data, handles security, and connects to the database. Built with C# and ASP.NET Core.

---

## 📂 Project Structure

This section explains the main folders and files in the workspace so stakeholders can easily navigate the codebase.

### `/frontend` - The User Interface
This directory contains everything the user sees in their web browser.
- **`src/pages/`**: Contains the different screens of the app (e.g., Login Page, Member Dashboard, Admin Settings, Entry Kiosk).
- **`src/components/`**: Reusable building blocks for the UI (like buttons, navigation bars, modal popups, and layouts).
- **`src/services/`**: The code that communicates with the backend API to fetch or save data securely.
- **`src/App.jsx`**: The main router file that dictates which page to show based on the web address (URL).
- **`package.json`**: Lists all the external libraries (dependencies) the frontend needs to run.
- **`vite.config.js`**: Configuration for our build tool (Vite) that compiles our code extremely fast for the browser.

### `/backend` - The API & Business Logic
This directory handles the heavy lifting, security, database connections, and business rules.
- **`KabakalGym.API/Controllers/`**: The "receptionists" of the backend. They receive requests from the frontend (like "login" or "fetch members") and pass them to the appropriate service.
- **`KabakalGym.API/Services/`**: The "workers" of the system. This is where the actual business rules live (e.g., how to process a payment, how to generate an AI workout, how to verify an email).
- **`KabakalGym.API/Models/`**: Defines the blueprint for our data (e.g., what information a "User" or a "Subscription" holds).
- **`KabakalGym.API/Data/`**: Manages the connection to the database (Entity Framework Core) and handles saving/retrieving the Models.
- **`KabakalGym.API/Program.cs`**: The most important startup file. It sets up the database connection, security rules (like rate limiting to prevent spam), dependency injection, and middleware before the server starts.
- **`appsettings.json`**: The configuration file where we store non-secret settings. (Note: Secret keys like database passwords are kept in secure environment variables, never in this file).

---

## 🔌 Third-Party Integrations

The system relies on several powerful external services to provide advanced features without reinventing the wheel:
- **PostgreSQL (Neon.tech)**: Our primary, cloud-hosted database for storing all gym records.
- **Cloudinary**: Securely stores and serves user-uploaded images (like profile pictures) so our server doesn't get bloated.
- **Brevo/Resend**: Sends automated emails reliably (used for email verification codes and password resets).
- **Xendit**: Processes secure online payments for gym subscriptions and transactions.
- **Google Gemini**: Powers our AI Chatbot and intelligent workout generator, providing dynamic responses to members.

## 🚀 Getting Started

**To run the frontend locally:**
1. Open a terminal and navigate to the `frontend` folder.
2. Run `npm install` to download dependencies.
3. Run `npm run dev` to start the local web server.

**To run the backend locally:**
1. Open a terminal and navigate to `backend/KabakalGym.API`.
2. Ensure you have the necessary environment variables set (Database connection, JWT Secret, Cloudinary keys, etc.).
3. Run `dotnet run` to start the API server.

---
*This guide is designed to make the repository accessible to everyone involved in the project. If you need further technical details, refer to the individual files or consult the development team.*
