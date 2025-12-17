import React, { useState, useRef, useEffect } from 'react';
import '../styles/components/LazyImage.css';

/**
 * Lazy loading image component with loading states and error handling
 */
export function LazyImage({
  src,
  alt,
  placeholder,
  className = '',
  onLoad,
  onError,
  threshold = 100,
  rootMargin = '50px',
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: threshold / 100,
        rootMargin
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  return (
    <div className={`lazy-image-container ${className}`} ref={imgRef}>
      {/* Placeholder/Loading state */}
      {!isLoaded && !hasError && (
        <div className="lazy-image-placeholder">
          {placeholder || <div className="image-skeleton" />}
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="lazy-image-error">
          <span>⚠️</span>
          <span>Failed to load image</span>
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`lazy-image ${isLoaded ? 'loaded' : ''}`}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Lazy loading background image component
 */
export function LazyBackground({
  src,
  className = '',
  children,
  placeholder = '',
  threshold = 100,
  rootMargin = '50px'
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: threshold / 100,
        rootMargin
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
    }
  }, [isInView, src]);

  const backgroundStyle = isLoaded
    ? { backgroundImage: `url(${src})` }
    : placeholder
      ? { backgroundImage: `url(${placeholder})` }
      : {};

  return (
    <div
      ref={containerRef}
      className={`lazy-background ${isLoaded ? 'loaded' : 'loading'} ${className}`}
      style={backgroundStyle}
    >
      {children}
    </div>
  );
}

/**
 * Lazy loading component for any content
 */
export function LazyLoad({
  children,
  placeholder,
  className = '',
  threshold = 100,
  rootMargin = '50px',
  fallback
}) {
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: threshold / 100,
        rootMargin
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={containerRef} className={`lazy-load ${className}`}>
      {isInView ? children : (placeholder || fallback || <div className="lazy-placeholder" />)}
    </div>
  );
}

/**
 * Hook for lazy loading any resource
 */
export function useLazyLoad(options = {}) {
  const {
    threshold = 100,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;

        if (triggerOnce && inView && !hasTriggered) {
          setIsInView(true);
          setHasTriggered(true);
          observer.disconnect();
        } else if (!triggerOnce) {
          setIsInView(inView);
        }
      },
      {
        threshold: threshold / 100,
        rootMargin
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return [elementRef, isInView];
}

export default LazyImage;
