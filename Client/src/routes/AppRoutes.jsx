import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Pages
import HomePage from '../pages/HomePage';
import Rooms from '../pages/Rooms';
import RoomDetails from '../pages/RoomDetails';
import Login from '../pages/Login';
import SignUp from '../pages/SignUp';
import BookingPage from '../pages/BookingPage';
import MyBookings from '../pages/MyBookings';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageRooms from '../pages/admin/ManageRooms';
import ManageBookings from '../pages/admin/ManageBookings';
import ManageUsers from '../pages/admin/ManageUsers';
import Reports from '../pages/admin/Reports';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="rooms/:id" element={<RoomDetails />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="register" element={<SignUp />} />

        {/* Authenticated Customer Routes */}
        <Route
          path="booking/:roomId"
          element={
            <ProtectedRoute allowedRoles={['guest', 'customer', 'staff', 'admin']}>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-bookings"
          element={
            <ProtectedRoute allowedRoles={['guest', 'customer', 'staff', 'admin']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute allowedRoles={['guest', 'customer', 'staff', 'admin']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={['guest', 'customer', 'staff', 'admin']}>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Protected Administrator Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/rooms"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageRooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/bookings"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <ManageBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<MainLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
