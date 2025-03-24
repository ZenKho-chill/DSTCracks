import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './Register';
import Verify from './Verify'; // Import the Verify component
import Login from './Login'; // Import the Login component
import ForgotPassword from './ForgotPassword'; // Import the ForgotPassword component
import ResetPassword from './ResetPassword'; // Import the ResetPassword component
import Profile from './Profile'; // Import the Profile component
import AccountRecovery from './AccountRecovery';
import AdminDashboard from './AdminDashboard';
import GameDetail from './GameDetail';
import Report from './Report';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify/:token" element={<Verify />} /> {/* Add the Verify route */}
      <Route path="/login" element={<Login />} /> {/* Add the Login route */}
      <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Add the ForgotPassword route */}
      <Route path="/reset-password" element={<ResetPassword />} /> {/* Add the ResetPassword route */}
      <Route path="/profile" element={<Profile />} /> {/* Add the Profile route */}
      <Route path="/recover" element={<AccountRecovery />} />
      <Route path="/game/:gameId" element={<GameDetail />} /> {/* Fix the route path */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/report" element={<Report />} />
    </Routes>
  </Router>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals.console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
