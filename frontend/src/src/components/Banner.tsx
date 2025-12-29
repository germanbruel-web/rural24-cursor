
import React from 'react';

interface BannerProps {
  imageUrl: string;
  linkUrl: string;
  altText: string;
}

export const Banner: React.FC<BannerProps> = ({ imageUrl, linkUrl, altText }) => {
  return (
    <div className="my-8">
      <a href={linkUrl} target="_blank" rel="noopener noreferrer">
        <img 
          src={imageUrl} 
          alt={altText} 
          className="w-full h-auto rounded-lg shadow-md object-cover"
        />
      </a>
    </div>
  );
};
