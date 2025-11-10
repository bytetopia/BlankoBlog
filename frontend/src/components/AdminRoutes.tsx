import { Routes, Route } from 'react-router-dom'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminPostsPage from '../pages/admin/AdminPostsPage'
import AdminTagsPage from '../pages/admin/AdminTagsPage'
import AdminSettingsPage from '../pages/admin/AdminSettingsPage'
import AdminPostEditorPage from '../pages/admin/AdminPostEditorPage'

// This component bundles all admin functionality into a single chunk
// It will only be loaded when admin routes are accessed
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/posts" element={<AdminPostsPage />} />
      <Route path="/admin/posts/new" element={<AdminPostEditorPage />} />
      <Route path="/admin/posts/:id" element={<AdminPostEditorPage />} />
      <Route path="/admin/tags" element={<AdminTagsPage />} />
      <Route path="/admin/settings" element={<AdminSettingsPage />} />
    </Routes>
  )
}

export default AdminRoutes