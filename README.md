# HelpMyEvent 🤝

**HelpMyEvent** is a modern, full-stack web application designed to connect event organizers with talented service providers. Whether you're planning a wedding, a corporate conference, or a birthday party, this platform helps you find the right professionals to bring your vision to life.

This project was bootstrapped with [Firebase Studio](https://firebase.google.com/studio).

## ✨ Key Features

- **Event Discovery:** Browse and search for events based on type, location, and keywords.
- **Service Provider Profiles:** Service providers can create detailed profiles showcasing their skills, portfolio, and experience.
- **Offer System:** Providers can submit offers for events, and organizers can accept or decline them.
- **Real-time Messaging:** Integrated chat for seamless communication between users.
- **AI-Powered Recommendations:** Get intelligent suggestions for service providers based on event details.
- **Secure Authentication:** User accounts are secured with Firebase Authentication.
- **Responsive Design:** A mobile-first interface that works beautifully on all devices.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit) (with Google's Gemini models)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/helpmyevent.git
    cd helpmyevent
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up Environment Variables:**

    This project requires a Firebase project to run. Create a `.env.local` file in the root of your project and add your Firebase configuration. You can get these values from your Firebase project settings.

    ```.env.local
    NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="12345..."
    NEXT_PUBLIC_FIREBASE_APP_ID="1:12345...:web:..."

    # For Google Maps on the events page
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..."
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔥 Firebase Setup

The application is deeply integrated with Firebase for authentication and database services.

- **Authentication:** Manages user sign-up, login, and sessions using Firebase Authentication.
- **Firestore:** The database is structured to support user profiles, events, offers, and messages. Security rules are in place (`firestore.rules`) to protect user data.

To use this project, you'll need to set up a Firebase project and enable **Authentication** (with Email/Password provider) and **Firestore**.
