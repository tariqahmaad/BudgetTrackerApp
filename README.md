# Budget Tracker Application 📊💰

Welcome to the **Budget Tracker Application** repository! This project is meticulously designed to provide users with a robust platform for managing personal finances effectively. Whether it’s tracking income and expenses, managing debts, or setting financial goals, this application offers a seamless, secure, and professional experience powered by **React Native** and **Firebase**.

---

## 🌟 Key Features

- **Secure User Authentication**
  - Implemented with Firebase Authentication for robust sign-up, login, and password recovery mechanisms.

- **Comprehensive Transaction Management**
  - Add, view, and delete income or expense entries with ease.

- **Debt Management**
  - Efficiently track shared expenses and balances with friends or family members.

- **Insightful Financial Dashboards**
  - Interactive charts and summaries for real-time insights into your financial health.

- **Multi-Currency Support**
  - Seamlessly handle transactions in various currencies using the ExchangeRate-API.

- **Real-Time Data Synchronization**
  - Firebase Firestore ensures your data stays up-to-date across all devices.

---

## 🛠️ Technology Stack

- **Frontend**: React Native, Expo CLI, React Native Paper
- **Backend**: Firebase (Authentication, Firestore, Hosting)
- **APIs**: ExchangeRate-API for currency conversion
- **State Management**: React Hooks (`useState`, `useEffect`)

---

## 🏗️ Installation and Setup

### Prerequisites

Ensure your system is equipped with:
- **Node.js**
- **Expo CLI**
- **Firebase CLI**

### Setup Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/tariqahmaad/BudgetTrackerApp.git
   cd BudgetTrackerApp
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project.
   - Replace placeholder configurations in `firebase.js` with your Firebase credentials.

4. Start the application:
   ```bash
   npx expo start
   ```

---

## 🚀 Deployment

### Android and iOS Deployment
- Build the app using Expo:
  ```bash
  expo build:android
  expo build:ios
  ```
- Distribute your app via Google Play Store or Apple App Store.

### Web Deployment
- Build and deploy the web version:
  ```bash
  expo export:web
  firebase deploy
  ```

---

## 🖼️ Screenshots & Highlights

- **Dashboard**: Track savings progress and spending trends at a glance.
- **Add Transaction**: Log income or expenses with a streamlined interface.
- **Track Debt**: Simplify shared expense tracking with intuitive features.
- **Profile Management**: Set financial targets and manage personal details.

---

## 📜 Licensing

This project is licensed under the **MIT License**, making it open for contributions and adaptations.

---

## 🙌 Acknowledgments

We extend gratitude to the following tools and services:
- **[React Native](https://reactnative.dev/)** for its versatile framework.
- **[Firebase](https://firebase.google.com/)** for seamless backend integration.
- **[ExchangeRate-API](https://www.exchangerate-api.com/)** for reliable currency conversion.

---

## 🤝 Contributing Guidelines

Contributions are welcome! Follow these steps:
1. Fork the repository.
2. Submit a pull request for review.
3. For substantial changes, please open an issue to discuss your ideas.

---

## 📧 Developer Information

- **Developer**: Tariq Ahmad
- **Contact**: [GitHub](https://github.com/tariqahmaad)

---

**Together, let’s foster financial literacy and awareness!** 🌍✨
