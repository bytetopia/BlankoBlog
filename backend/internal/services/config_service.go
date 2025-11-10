package services

import (
	"errors"

	"gorm.io/gorm"
	"github.com/bytetopia/BlankoBlog/backend/internal/models"
)

type ConfigService struct {
	db *gorm.DB
}

func NewConfigService(db *gorm.DB) *ConfigService {
	return &ConfigService{db: db}
}

// GetAllConfigs retrieves all configuration settings
func (s *ConfigService) GetAllConfigs() (map[string]string, error) {
	var configs []models.Config
	if err := s.db.Find(&configs).Error; err != nil {
		return nil, err
	}

	configMap := make(map[string]string)
	for _, config := range configs {
		configMap[config.Key] = config.Value
	}

	// Set default values if configs don't exist
	s.setDefaultConfigs(configMap)

	return configMap, nil
}

// UpdateConfigs updates multiple configuration settings
func (s *ConfigService) UpdateConfigs(configUpdates map[string]string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for key, value := range configUpdates {
			var config models.Config
			err := tx.Where("key = ?", key).First(&config).Error

			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					// Create new config
					newConfig := models.Config{
						Key:   key,
						Value: value,
					}
					if err := tx.Create(&newConfig).Error; err != nil {
						return err
					}
				} else {
					return err
				}
			} else {
				// Update existing config
				config.Value = value
				if err := tx.Save(&config).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

// GetConfig retrieves a specific configuration value
func (s *ConfigService) GetConfig(key string) (string, error) {
	var config models.Config
	err := s.db.Where("key = ?", key).First(&config).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Return default value for known keys
			defaultValue := s.getDefaultValue(key)
			if defaultValue != "" {
				return defaultValue, nil
			}
			return "", errors.New("configuration not found")
		}
		return "", err
	}

	return config.Value, nil
}

// setDefaultConfigs ensures default configurations exist
func (s *ConfigService) setDefaultConfigs(configMap map[string]string) {
	defaults := map[string]string{
		"blog_name":         "Blanko Blog",
		"blog_description":  "A simple and elegant blog platform",
		"blog_introduction": "Welcome to our blog where we share insights, stories, and knowledge.",
	}

	for key, defaultValue := range defaults {
		if _, exists := configMap[key]; !exists {
			configMap[key] = defaultValue
		}
	}
}

// getDefaultValue returns the default value for a known configuration key
func (s *ConfigService) getDefaultValue(key string) string {
	defaults := map[string]string{
		"blog_name":         "Blanko Blog",
		"blog_description":  "A simple and elegant blog platform",
		"blog_introduction": "Welcome to our blog where we share insights, stories, and knowledge.",
	}

	return defaults[key]
}

// InitializeDefaultConfigs creates default configuration entries in the database
func (s *ConfigService) InitializeDefaultConfigs() error {
	defaults := map[string]models.Config{
		"blog_name": {
			Key:         "blog_name",
			Value:       "Blanko Blog",
			Description: "The name of the blog displayed in the header",
		},
		"blog_description": {
			Key:         "blog_description",
			Value:       "A simple and elegant blog platform",
			Description: "A brief description of the blog",
		},
		"blog_introduction": {
			Key:         "blog_introduction",
			Value:       "Welcome to our blog where we share insights, stories, and knowledge.",
			Description: "An introduction text displayed on the homepage",
		},
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		for _, config := range defaults {
			var existingConfig models.Config
			err := tx.Where("key = ?", config.Key).First(&existingConfig).Error

			if errors.Is(err, gorm.ErrRecordNotFound) {
				if err := tx.Create(&config).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}