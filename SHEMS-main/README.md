# Smart Home Energy Management System (SHEMS)

SHEMS is a full-stack application for monitoring, managing, and optimizing energy consumption in smart homes.

## Repository Layout

- `frontend/` — React + Vite user interface
- `src/` — Spring Boot backend Java source
- `pom.xml` — backend Maven configuration
- `mvnw`, `mvnw.cmd` — Maven wrapper for building the backend
- `.gitignore` — ignores generated build artifacts, logs, DB files, and node_modules

## Prerequisites

- Java 17
- Maven (or use the included Maven wrapper)
- Node 20+ and npm
- Git for source control

## Setup

1. Open a terminal and navigate to the project root:

   ```powershell
   cd SHEMS-main
   ```

2. Install frontend dependencies:

   ```powershell
   npm run frontend:install
   ```

3. Build or run the backend using Maven:

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

   or build the backend package:

   ```powershell
   .\mvnw.cmd clean package
   ```

## Run Locally

- Start the backend:

  ```powershell
  .\mvnw.cmd spring-boot:run
  ```

- Start the frontend in development mode:

  ```powershell
  npm run frontend:dev
  ```

The backend runs on `http://localhost:8080` and the frontend runs on `http://localhost:5173` by default.

## Production Build

1. Build the frontend assets:

   ```powershell
   npm run frontend:build
   ```

2. Build the backend JAR:

   ```powershell
   .\mvnw.cmd clean package
   ```

3. Run the assembled backend application:

   ```powershell
   java -jar target/backend-0.0.1-SNAPSHOT.jar
   ```

## GitHub Setup

To add this project to GitHub:

```powershell
cd SHEMS-main
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

Replace `<username>` and `<repo>` with your GitHub username and repository name.

## Notes

- The frontend asset build is copied into the backend static resources during packaging.
- Existing database files such as `shems_db.mv.db` and `shems_db.trace.db` are ignored by `.gitignore`.
- Use the Maven wrapper scripts so the project builds consistently across machines.
