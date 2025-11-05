import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import './index.css'
import AppInitializer from './AppInitializer'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppInitializer>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AppInitializer>
  </React.StrictMode>
)
