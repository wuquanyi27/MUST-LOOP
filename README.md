# MustLoop – Campus Sustainable Collaboration Platform

**MustLoop** is a unified web platform built for the **Macau University of Science and Technology (MUST)**. It integrates a second‑hand marketplace, a skill‑sharing bank, a project team recruitment board, and a quick‑task outsourcing board, backed by a mutual rating system. The project promotes circular economy, peer‑to‑peer learning, and interdisciplinary collaboration within the campus community.

> **Live Demo** – Open `index.html` in any modern browser.  
> **Demo Account** – Student ID: `1230009568` | Password: `123456`

---

## 📖 Table of Contents

- [Project Overview](#-project-overview)
- [Core Features](#-core-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Development Process & Agile Practices](#-development-process--agile-practices)
- [Team Members](#-team-members)
- [Release History](#-release-history)
- [License](#-license)
- [Acknowledgements](#-acknowledgements)

---

## 📖 Project Overview

Campus resource sharing at MUST is fragmented across scattered WeChat groups and generic third‑party platforms, leading to inefficient transactions, lack of trust, and poor discoverability of talent and skills. MustLoop solves these problems by providing a **single, trusted, structured platform** where every interaction leaves a traceable reputation trail.

**Key objectives:**
- Enable seamless second‑hand trading of textbooks, electronics, and household items.
- Facilitate skill exchange and tutoring via a transparent booking system.
- Lower the barrier for forming interdisciplinary project teams.
- Provide a quick‑task outsourcing mechanism with built‑in rewards.
- Build a trusted community through mutual star‑ratings and reviews.

MustLoop is a **100% front‑end** web application built with vanilla HTML, CSS, and JavaScript. All data is stored in‑memory (simulating a backend) and the application can be deployed with zero dependencies.

---

## ✨ Core Features

| Module | Description |
|--------|-------------|
| **🔐 Authentication** | Student ID registration (10‑digit validation), password visibility toggle, demo account hint. |
| **🛒 Circular Market** | Publish second‑hand items with photos, condition, and price. Browse a responsive grid, view item details, purchase with one click, and track purchases in “My Purchases”. |
| **🎓 Skill Bank** | Offer or find skills (tutoring, languages, music, design) with hourly rates and available time slots. Book a session through a dedicated booking modal. |
| **🚀 Project Board** | Post startup or research ideas, specify required roles, and set a deadline. Interested students submit detailed applications (contact, skills, reason). Initiators can accept or reject applicants. |
| **📋 Task Board** | Post quick tasks (pickup, delivery, tutoring help) with MUST‑coin rewards. Claim a task, complete it, and rate your partner. |
| **👤 My Page** | Manage all your posts, ongoing participations, and purchase history. Edit profile (nickname, avatar, college, year). Expand participant lists and take action (accept/reject). |
| **⭐ Reputation System** | After completing a transaction or task, both parties rate each other with 1‑5 stars and a text review. Ratings are stored in‑memory and contribute to trust. |
| **💬 In‑App Chat** | Contact sellers, service providers, or task owners directly through a built‑in chat modal that supports real‑time messaging simulation. |
| **🌐 Bilingual Support** | Switch between Chinese and English with one click. All UI elements (labels, buttons, modals) adapt dynamically. |
| **📱 Fully Responsive** | Fluid grid, flexbox layouts, and media queries ensure a polished experience on mobile, tablet, and desktop. |

---

## 🖼️ Screenshots

| Market Module | Skill Bank | Project Board | Task Board |
|---------------|------------|---------------|------------|
| ![Market](screenshots/market.png) | ![Skill](screenshots/skill.png) | ![Project](screenshots/project.png) | ![Task](screenshots/task.png) |

*Screenshots are located in the `/screenshots` folder. Replace with actual images from your local demo.*

---

## 🛠️ Tech Stack

- **HTML5** – Semantic markup, accessible data attributes for i18n
- **CSS3** – Custom properties (design tokens), Flexbox, Grid, responsive media queries, transitions
- **Vanilla JavaScript (ES6+)** – No frameworks. Modular functions, in‑memory state management (`store` object), DOM manipulation, event handling
- **Font Awesome 5** – Icon library
- **Google Fonts (Inter)** – Typography
- **GitHub** – Version control, issue tracking, project boards, Pull Request reviews

---

## 🚀 Getting Started

### Prerequisites
Any modern web browser: Chrome, Firefox, Safari, or Edge. No server or build tools required.

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/mustloop/mustloop-platform.git
