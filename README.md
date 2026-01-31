# Easy Time-off

A unified employee leave management platform.

## Project Structure

This is a Full Stack application consisting of:

1.  **Frontend**: React + TypeScript + Vite (`/frontend` Directory)
2.  **Backend**: Java Spring Boot 3 + JDK 21 (`/backend` Directory)

## 🚀 Running the Frontend (Client)

The frontend is a React Single Page Application.

```bash
cd frontend
npm install
npm run dev
```

*Note: The frontend currently runs in "Mock Mode" using `frontend/services/api.ts` to simulate a backend for immediate demonstration. To switch to the real Java backend, update `frontend/services/api.ts` to fetch from `http://localhost:8080/api`.*

## ☕ Running the Backend (Server)

The backend is a standard Spring Boot application using Maven.

### Prerequisites
*   JDK 21
*   Maven

### Setup

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Run the application:
    ```bash
    mvn spring-boot:run
    ```
    
The server will start on `http://localhost:8080`.

### Database
*   **Development**: Uses H2 In-Memory Database.
*   **Console**: Access `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:easytimeoffdb`)

## Features implemented
*   **Active Directory Integration** (Stubbed in `User.java`)
*   **Leave Management** (CRUD via `LeaveController`)
*   **Data Sources**: Supports ENUMs for HR, Outlook, and Manual sources.
