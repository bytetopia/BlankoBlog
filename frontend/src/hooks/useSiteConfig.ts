import { useState, useEffect } from 'react'
import { settingsAPI } from '../services/api'

interface SiteConfig {
  blogName: string
  isLoading: boolean
  error: string | null
}

export const useSiteConfig = () => {
  const [config, setConfig] = useState<SiteConfig>({
    blogName: 'BlankoBlog', // Default fallback
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const fetchSiteConfig = async () => {
      try {
        const response = await settingsAPI.getConfig()
        const configData = response.data.configs
        const blogName = configData.blog_name || 'Blanko Blog'
        
        setConfig({
          blogName,
          isLoading: false,
          error: null,
        })

        // Update document title
        document.title = blogName
      } catch (err) {
        console.error('Error fetching site config:', err)
        setConfig({
          blogName: 'Blanko Blog',
          isLoading: false,
          error: 'Failed to load site configuration',
        })
        // Set default title if config fetch fails
        document.title = 'Blanko Blog'
      }
    }

    fetchSiteConfig()
  }, [])

  return config
}