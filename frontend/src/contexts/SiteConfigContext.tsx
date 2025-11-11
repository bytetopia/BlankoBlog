import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { settingsAPI } from '../services/api'

interface SiteConfig {
  blogName: string
  isLoading: boolean
  error: string | null
}

interface SiteConfigContextType extends SiteConfig {
  refetchConfig: () => Promise<void>
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined)

interface SiteConfigProviderProps {
  children: ReactNode
}

export const SiteConfigProvider: React.FC<SiteConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>({
    blogName: 'BlankoBlog', // Default fallback
    isLoading: true,
    error: null,
  })

  const fetchSiteConfig = async () => {
    try {
      setConfig(prev => ({ ...prev, isLoading: true, error: null }))
      const response = await settingsAPI.getConfig()
      const configData = response.data.configs
      const blogName = configData.blog_name || 'Blanko Blog'
      
      setConfig({
        blogName,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      console.error('Error fetching site config:', err)
      setConfig({
        blogName: 'Blanko Blog',
        isLoading: false,
        error: 'Failed to load site configuration',
      })
    }
  }

  useEffect(() => {
    fetchSiteConfig()
  }, [])

  const contextValue: SiteConfigContextType = {
    ...config,
    refetchConfig: fetchSiteConfig,
  }

  return (
    <SiteConfigContext.Provider value={contextValue}>
      {children}
    </SiteConfigContext.Provider>
  )
}

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext)
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider')
  }
  return context
}