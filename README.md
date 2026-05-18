# Dynamic QR Attendance System - Frontend

A premium React Native mobile application for scanning dynamic QR codes to mark attendance.

## 🚀 Features

- **Secure Authentication**: JWT-based login with secure local storage.
- **Dynamic Dashboard**: Real-time attendance status and statistics.
- **QR Scanner**: Fast and responsive QR code scanning with torch support.
- **Modern UI**: Clean design using White, Black, and Vibrant Green (#7ED957).
- **Global Error Handling**: Centralized API response management.

## 🛠 Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation
- **Networking**: Axios
- **Icons**: Lucide React Native
- **Storage**: Expo Secure Store
- **Camera**: Expo Camera

## 📂 Project Structure

```text
src/
├── components/   # Reusable UI components
├── navigation/   # Navigation configuration
├── screens/      # Application screens
├── services/     # API and external services
├── theme/        # Color palette and styles
└── utils/        # Helper functions and storage
```

## 🏃 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo Go app on your mobile device (to test locally)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Scan the QR code with your phone:
   - **Android**: Use the Expo Go app.
   - **iOS**: Use the Camera app.

## ⚙️ Configuration

To connect to your real backend, update the `API_BASE_URL` in `src/services/api.js`:

```javascript
const API_BASE_URL = 'https://your-api-domain.com/api';
```

## 📝 License

MIT
