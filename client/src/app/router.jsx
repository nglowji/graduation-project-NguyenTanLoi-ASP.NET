import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import BookingDetailPage from '../pages/BookingDetailPage'
import BookingPage from '../pages/BookingPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import PartnerRegisterPage from '../pages/PartnerRegisterPage'
import RegisterPage from '../pages/RegisterPage'
import ServicesPage from '../pages/ServicesPage'

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
