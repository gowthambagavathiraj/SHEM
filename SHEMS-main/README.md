# Smart Home Energy Management System (SHEMS)

SHEMS is a full-stack application designed to monitor, manage, and optimize energy consumption in smart homes.

## 🛠️ Technical Tools & Stack

### Backend
- **Core Framework**: [Spring Boot 3.2.5](https://spring.io/projects/spring-boot) (Java 17)
- **Security**: [Spring Security](https://spring.io/projects/spring-security) with **JWT (JSON Web Tokens)** for stateless authentication.
- **Data Access**: [Spring Data JPA](https://spring.io/projects/spring-data-jpa) with **Hibernate**.
- **Database**: **H2 Database** (Local/Development) and **MySQL** compatibility.
- **API Documentation**: [SpringDoc OpenAPI/Swagger](https://springdoc.org/) for interactive API testing.
- **PDF Generation**: [iText7](https://itextpdf.com/products/itext-7) for generating energy reports.
- **Utilities**: [Lombok](https://projectlombok.org/) for reducing boilerplate code.

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth UI transitions.
- **Charts**: [Recharts](https://recharts.org/) for visualizing energy usage data.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **API Client**: [Axios](https://axios-http.com/)

### Dev & Build Tools
- **Build System**: Maven
- **Version Control**: Git & GitHub
- **Environment**: Visual Studio Code / Spring Tool Suite (STS)

## 🚀 Key Features
- **Real-time Monitoring**: Track energy usage across devices.
- **Smart Scheduling**: Automate device operations to save energy.
- **Personalized Recommendations**: AI-driven insights for energy saving.
- **Secure Authentication**: Multi-role support (Homeowner, Admin).
- **Comprehensive Reporting**: Downloadable PDF energy reports.
