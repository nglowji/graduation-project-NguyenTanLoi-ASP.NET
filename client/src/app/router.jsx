import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import BookingDetailPage from '../pages/booking/BookingDetailPage'
import BookingPage from '../pages/booking/BookingPage'
import HomePage from '../pages/home/HomePage'
import PartnerRegisterPage from '../pages/partner/PartnerRegisterPage'
import ServicesPage from '../pages/services/ServicesPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'dat-san',
        element: <BookingPage />,
      },
      {
        path: 'dat-san/:courtId',
        element: <BookingDetailPage />,
      },
      {
        path: 'dich-vu',
        element: <ServicesPage />,
      },
      {
        path: 'dang-nhap',
        element: <LoginPage />,
      },
      {
        path: 'dang-ky-doi-tac',
        element: <PartnerRegisterPage />,
      },
      {
        path: 'dang-ky',
        element: <RegisterPage />,
      },
    ],
  },
])
