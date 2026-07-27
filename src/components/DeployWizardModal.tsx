import React from 'react';
import AddInstanceWizard, { BotType, TargetAudience } from './AddInstanceWizard';
import { Bot } from '../types';

export interface DeployWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (botData: Omit<Bot, 'id' | 'uptime' | 'memory' | 'cpu' | 'commandsCount' | 'version'>) => void;
}

export type { BotType, TargetAudience };

export default function DeployWizardModal({ isOpen, onClose, onDeploy }: DeployWizardModalProps) {
  return (
    <AddInstanceWizard 
      isOpen={isOpen}
      onClose={onClose}
      onDeploy={onDeploy}
    />
  );
}
