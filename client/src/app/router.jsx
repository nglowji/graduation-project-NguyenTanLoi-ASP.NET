import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import { LoginPage, RegisterPage } from '@/features/auth'
import { BookingDetailPage, BookingPage } from '@/features/booking'
import { ContactPage } from '@/features/contact'
import { HomePage } from '@/features/home'
import { PartnerRegisterPage } from '@/features/partner'
import { ServicesPage } from '@/features/services'

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
        path: 'lien-he',
        element: <ContactPage />,
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
