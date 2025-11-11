import React from 'react';
import { Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Tag } from '../services/api';

interface TagListProps {
  tags: Tag[];
  onTagClick?: (tag: Tag) => void;
  className?: string;
}

const TagList: React.FC<TagListProps> = ({ tags, onTagClick, className = '' }) => {
  const navigate = useNavigate();

  if (!tags || tags.length === 0) {
    return null;
  }

  const handleTagClick = (tag: Tag) => {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      // Default behavior: navigate to tag posts page
      navigate(`/tags/${tag.id}/posts`);
    }
  };

  return (
    <Box 
      className={className}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      {tags.map((tag) => (
        <Chip
          key={tag.id}
          label={tag.name}
          clickable
          onClick={() => handleTagClick(tag)}
          sx={{
            backgroundColor: tag.color || '#1976d2',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: tag.color ? `${tag.color}cc` : '#1565c0',
            },
            '& .MuiChip-label': {
              color: '#ffffff',
              fontWeight: 500,
            },
          }}
        />
      ))}
    </Box>
  );
};

export default TagList;