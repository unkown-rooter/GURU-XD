import React from 'react';
import { DeveloperOutputRenderer } from '../outputEngine/DeveloperOutputRenderer';

export interface EngineeringMessageRendererProps {
  content: string;
}

export function EngineeringMessageRenderer({ content }: EngineeringMessageRendererProps) {
  return (
    <DeveloperOutputRenderer content={content} />
  );
}

