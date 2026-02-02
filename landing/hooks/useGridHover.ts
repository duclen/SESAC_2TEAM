import { useCallback, useState, useRef, MouseEvent } from 'react';

interface GridHoverState {
  isHovered: boolean;
  mouseX: number;
  mouseY: number;
  elementX: number;
  elementY: number;
  percentX: number;
  percentY: number;
}

interface UseGridHoverReturn {
  hoverState: GridHoverState;
  handlers: {
    onMouseEnter: (e: MouseEvent<HTMLElement>) => void;
    onMouseMove: (e: MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
  };
  style: React.CSSProperties;
}

const initialState: GridHoverState = {
  isHovered: false,
  mouseX: 0,
  mouseY: 0,
  elementX: 0,
  elementY: 0,
  percentX: 50,
  percentY: 50,
};

export const useGridHover = (intensity: number = 10): UseGridHoverReturn => {
  const [hoverState, setHoverState] = useState<GridHoverState>(initialState);
  const elementRef = useRef<DOMRect | null>(null);

  const onMouseEnter = useCallback((e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    elementRef.current = rect;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    setHoverState({
      isHovered: true,
      mouseX: e.clientX,
      mouseY: e.clientY,
      elementX: x,
      elementY: y,
      percentX,
      percentY,
    });
  }, []);

  const onMouseMove = useCallback((e: MouseEvent<HTMLElement>) => {
    if (!elementRef.current) return;

    const rect = elementRef.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;

    setHoverState(prev => ({
      ...prev,
      mouseX: e.clientX,
      mouseY: e.clientY,
      elementX: x,
      elementY: y,
      percentX,
      percentY,
    }));
  }, []);

  const onMouseLeave = useCallback(() => {
    elementRef.current = null;
    setHoverState(initialState);
  }, []);

  // Calculate transform based on mouse position
  const rotateX = hoverState.isHovered
    ? ((hoverState.percentY - 50) / 50) * -intensity
    : 0;
  const rotateY = hoverState.isHovered
    ? ((hoverState.percentX - 50) / 50) * intensity
    : 0;

  const style: React.CSSProperties = {
    transform: hoverState.isHovered
      ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
      : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: hoverState.isHovered
      ? 'transform 0.1s ease-out'
      : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return {
    hoverState,
    handlers: {
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
    },
    style,
  };
};

export default useGridHover;
