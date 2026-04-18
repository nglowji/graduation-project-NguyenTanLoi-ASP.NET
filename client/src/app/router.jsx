import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import BookingDetailPage from '../pages/BookingDetailPage'
import BookingPage from '../pages/BookingPage'
import HomePage from '../pages/HomePage'

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
    ],
  },
])
