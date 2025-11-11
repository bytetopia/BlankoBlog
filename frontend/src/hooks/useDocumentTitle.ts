import { useEffect } from 'react'
import { useSiteConfig } from './useSiteConfig'

export const useDocumentTitle = (pageTitle?: string) => {
  const { blogName, isLoading } = useSiteConfig()

  useEffect(() => {
    // Don't update title until site config is loaded
    if (isLoading) {
      return
    }

    if (pageTitle) {
      // For specific pages, use "Page Title | Site Name" format
      document.title = `${pageTitle} | ${blogName}`
    } else {
      // For home page, just use site name
      document.title = blogName
    }
  }, [pageTitle, blogName, isLoading])

  return { blogName }
}