import { RouterProvider } from 'react-router-dom'
import { routes } from './routes.jsx'
import ToastProvider from './components/ToastProvider.jsx'

function App() {
  return (
    <ToastProvider>
      <RouterProvider router={routes} />
    </ToastProvider>
  )
}

export default App
