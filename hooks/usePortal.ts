import { useState, useEffect } from 'react';
import { MODAL_AREA_ID } from "@/utils/constants";

export function usePortal() {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const existingContainer = document.getElementById(MODAL_AREA_ID);
      if (existingContainer) {
        setPortalContainer(existingContainer);
      } else {
        const container = document.createElement('div');
        container.id = MODAL_AREA_ID;
        document.body.appendChild(container);
        setPortalContainer(container);
      }
    }
  }, []);

  return portalContainer;
}