import { Routes, Route } from 'react-router-dom'
import { Container } from '@mui/material'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import PostPage from './pages/PostPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import PostEditorPage from './pages/PostEditorPage'

function App() {
  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ px: 2, py: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts/:slug" element={<PostPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/posts/new" element={<PostEditorPage />} />
          <Route path="/admin/posts/:id" element={<PostEditorPage />} />
        </Routes>
      </Container>
    </>
  )
}

export default App
