import { Routes, Route } from 'react-router-dom'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminPostsPage from '../pages/admin/AdminPostsPage'
import AdminTagsPage from '../pages/admin/AdminTagsPage'
import AdminCommentsPage from '../pages/admin/AdminCommentsPage'
import AdminSettingsPage from '../pages/admin/AdminSettingsPage'
import AdminPostEditorPage from '../pages/admin/AdminPostEditorPage'
import AdminFilesPage from '../pages/admin/AdminFilesPage'
import AdminFileEditorPage from '../pages/admin/AdminFileEditorPage'

// This component bundles all admin functionality into a single chunk
// It will only be loaded when admin routes are accessed
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboardPage />} />
      <Route path="/posts" element={<AdminPostsPage />} />
      <Route path="/posts/new" element={<AdminPostEditorPage />} />
      <Route path="/posts/:id" element={<AdminPostEditorPage />} />
      <Route path="/tags" element={<AdminTagsPage />} />
      <Route path="/comments" element={<AdminCommentsPage />} />
      <Route path="/files" element={<AdminFilesPage />} />
      <Route path="/files/:id" element={<AdminFileEditorPage />} />
      <Route path="/settings" element={<AdminSettingsPage />} />
    </Routes>
  )
}

export default AdminRoutes