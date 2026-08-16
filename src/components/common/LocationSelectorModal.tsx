import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { LocationPicker } from '@/components/location/LocationPicker';
import { useLocation } from '@/context/LocationContext';

export interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: string;
  onSelectLocation?: (loc: string) => void;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const { location, setLocation } = useLocation();

  const handleSelect = (locStr: string, details?: any) => {
    setLocation(locStr, details);
    if (onSelectLocation) onSelectLocation(locStr);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Delivery Location">
      <div className="pt-1">
        <LocationPicker
          initialLocation={currentLocation || location}
          onClose={onClose}
          onSelectLocation={handleSelect}
        />
      </div>
    </Modal>
  );
};
