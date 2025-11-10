import React from 'react';
import { Box, Chip } from '@mui/material';
import type { Tag } from '../services/api';

interface TagListProps {
  tags: Tag[];
  onTagClick?: (tag: Tag) => void;
  className?: string;
}

const TagList: React.FC<TagListProps> = ({ tags, onTagClick, className = '' }) => {
  if (!tags || tags.length === 0) {
    return null;
  }

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
          clickable={!!onTagClick}
          onClick={() => onTagClick && onTagClick(tag)}
          sx={{
            backgroundColor: tag.color || '#1976d2',
            color: '#ffffff',
            '&:hover': onTagClick ? {
              backgroundColor: tag.color ? `${tag.color}cc` : '#1565c0',
            } : {},
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