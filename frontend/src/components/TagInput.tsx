import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Chip,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Circle as CircleIcon } from '@mui/icons-material';
import type { Tag } from '../services/api';
import { tagsAPI } from '../services/api';

interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
  allowCreate?: boolean;
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  selectedTags,
  onTagsChange,
  placeholder = 'Type to search or create tags...',
  allowCreate = true,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await tagsAPI.getAllTags();
        setAvailableTags(response.data.tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, []);

  // Filter tags based on input
  useEffect(() => {
    // If no input, show all available tags (excluding selected ones)
    if (!inputValue.trim()) {
      const unselected = availableTags.filter(
        (tag) => !selectedTags.find((selectedTag) => selectedTag.id === tag.id)
      );
      setFilteredTags(unselected);
      setHighlightedIndex(-1);
      return;
    }

    const filtered = availableTags.filter((tag) =>
      tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !selectedTags.find((selectedTag) => selectedTag.id === tag.id)
    );

    setFilteredTags(filtered);
    setHighlightedIndex(-1);
  }, [inputValue, availableTags, selectedTags]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredTags.length - 1 + (allowCreate && inputValue.trim() ? 1 : 0) ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => prev > -1 ? prev - 1 : prev);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        if (highlightedIndex < filteredTags.length) {
          handleSelectTag(filteredTags[highlightedIndex]);
        } else if (allowCreate && inputValue.trim()) {
          handleCreateTag();
        }
      } else if (allowCreate && inputValue.trim()) {
        handleCreateTag();
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      // Remove last tag when backspacing on empty input
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const handleSelectTag = (tag: Tag) => {
    if (!selectedTags.find((selectedTag) => selectedTag.id === tag.id)) {
      onTagsChange([...selectedTags, tag]);
    }
    setInputValue('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: Tag) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagToRemove.id));
  };

  const handleCreateTag = async () => {
    if (!inputValue.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const response = await tagsAPI.createTag({ name: inputValue.trim() });
      const newTag = response.data.tag;
      
      // Add to available tags and select it
      setAvailableTags((prev) => [...prev, newTag]);
      handleSelectTag(newTag);
    } catch (error) {
      console.error('Failed to create tag:', error);
      // Could show an error message to user here
    } finally {
      setIsLoading(false);
    }
  };

  const showCreateOption = allowCreate && inputValue.trim() && 
    !filteredTags.find(tag => tag.name.toLowerCase() === inputValue.toLowerCase());

  return (
    <Box className={className} sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={selectedTags.length === 0 ? placeholder : ''}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsDropdownOpen(true);
        }}
        onKeyDown={handleInputKeyDown}
        onFocus={() => setIsDropdownOpen(true)}
        inputRef={inputRef}
        InputProps={{
          startAdornment: selectedTags.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mr: 1 }}>
              {selectedTags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  onDelete={() => handleRemoveTag(tag)}
                  sx={{
                    backgroundColor: tag.color || '#1976d2',
                    color: '#ffffff',
                    '& .MuiChip-label': {
                      color: '#ffffff',
                      fontWeight: 500,
                    },
                    '& .MuiChip-deleteIcon': {
                      color: '#ffffff',
                      '&:hover': {
                        color: '#f0f0f0',
                      },
                    },
                  }}
                />
              ))}
            </Box>
          ) : undefined,
        }}
      />

      {/* Dropdown */}
      {isDropdownOpen && (filteredTags.length > 0 || showCreateOption) && (
        <Paper
          ref={dropdownRef}
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            mt: 0.5,
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          <List disablePadding dense>
            {filteredTags.map((tag, index) => (
              <ListItem key={tag.id} disablePadding>
                <ListItemButton
                  selected={index === highlightedIndex}
                  onClick={() => handleSelectTag(tag)}
                  sx={{ py: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CircleIcon
                      sx={{
                        color: tag.color || '#1976d2',
                        fontSize: 12,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={tag.name} />
                </ListItemButton>
              </ListItem>
            ))}
            
            {showCreateOption && (
              <>
                {filteredTags.length > 0 && (
                  <Box sx={{ borderTop: 1, borderColor: 'divider' }} />
                )}
                <ListItem disablePadding>
                  <ListItemButton
                    selected={filteredTags.length === highlightedIndex}
                    onClick={handleCreateTag}
                    disabled={isLoading}
                    sx={{ py: 0.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {isLoading ? (
                        <CircularProgress size={12} />
                      ) : (
                        <AddIcon sx={{ fontSize: 12 }} />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body2">
                          {isLoading ? 'Creating...' : `Create "${inputValue}"`}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default TagInput;