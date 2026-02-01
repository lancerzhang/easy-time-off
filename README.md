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

*Note: The frontend calls the real backend at `http://localhost:8080/api` and will fall back to mock data **only** if the backend is unreachable or returns a non-2xx error. This fallback is controlled by `USE_MOCK_FALLBACK` in `frontend/services/api.ts`.*

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
*   **PostgreSQL (Docker + dev profile)**:
    1. Start a local Postgres container:
        ```bash
        docker run --name easytimeoff-pg \
          -e POSTGRES_DB=easytimeoff \
          -e POSTGRES_USER=postgres \
          -e POSTGRES_PASSWORD=postgres \
          -p 5432:5432 \
          -v easytimeoff_pg:/var/lib/postgresql/data \
          -d postgres:16
        ```
    2. Run Spring Boot with the `dev` profile:
        ```bash
        cd backend
        SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
        ```
        or
        ```bash
        mvn spring-boot:run -Dspring-boot.run.profiles=dev
        ```
    3. Profile config lives in `backend/src/main/resources/application-dev.properties`.
    4. The `dev` profile disables mock data seeding (`app.seed-data=false`). Mock seeding remains enabled for the default H2 profile (`app.seed-data=true` in `application.properties`).
    5. Seed performance data (5000 users, pods, teams, favorites, leaves):
        ```bash
        docker exec -i easytimeoff-pg psql -U postgres -d easytimeoff < backend/scripts/seed_perf.sql
        ```
    6. Clear data and re-seed:
        ```bash
        docker exec -i easytimeoff-pg psql -U postgres -d easytimeoff < backend/scripts/seed_perf.sql
        ```
        *Note: The script truncates relevant tables at the start, so re-running it will wipe and rebuild data.*

## Features implemented
*   **Active Directory Integration** (Stubbed in `User.java`)
*   **Leave Management** (CRUD via `LeaveController`)
*   **Data Sources**: Supports ENUMs for HR, Outlook, and Manual sources.
