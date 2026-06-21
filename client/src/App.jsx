import { RouterProvider } from 'react-router-dom'
import { ToastProvider } from './contexts/ToastContext'
import { routes } from './routes.jsx'

function App() {
  return (
    <ToastProvider>
      <RouterProvider router={routes} />
    </ToastProvider>
  )
}

export default App
