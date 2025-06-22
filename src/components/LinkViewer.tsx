import React, { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, ExternalLink, Volume2, Play, Pause } from 'lucide-react';

interface LinkViewerProps {
  url: string;
  title: string;
  type?: 'video' | 'music' | 'backing' | 'resource' | 'link' | 'vocals' | 'image';
  onClose: () => void;
}

export function LinkViewer({ url, title, type = 'link', onClose }: LinkViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detect content type from URL
  const getContentType = () => {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'youtube';
    }
    if (urlLower.includes('vimeo.com')) {
      return 'vimeo';
    }
    if (urlLower.match(/\.(mp4|webm|ogg)$/)) {
      return 'video';
    }
    if (urlLower.match(/\.(mp3|wav|ogg|m4a)$/)) {
      return 'audio';
    }
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      return 'image';
    }
    if (urlLower.match(/\.(pdf)$/)) {
      return 'pdf';
    }
    return 'webpage';
  };

  const contentType = getContentType();

  // Convert YouTube URLs to embed format
  const getEmbedUrl = () => {
    if (contentType === 'youtube') {
      const videoId = extractYouTubeId(url);
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : url;
    }
    if (contentType === 'vimeo') {
      const videoId = extractVimeoId(url);
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    return url;
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const extractVimeoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFullscreen]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError(true);
  };

  const getTypeIcon = () => {
    switch (contentType) {
      case 'youtube':
      case 'vimeo':
      case 'video':
        return <Play className="h-5 w-5" />;
      case 'audio':
        return <Volume2 className="h-5 w-5" />;
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };

  const getTypeColor = () => {
    switch (contentType) {
      case 'youtube':
      case 'vimeo':
      case 'video':
        return 'text-red-600 bg-red-100';
      case 'audio':
        return 'text-green-600 bg-green-100';
      case 'image':
        return 'text-purple-600 bg-purple-100';
      case 'pdf':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center p-8">
            <ExternalLink className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load content</h3>
            <p className="text-gray-600 mb-4">This content cannot be displayed in the viewer.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in New Tab</span>
            </a>
          </div>
        </div>
      );
    }

    if (contentType === 'image') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
          <img
            src={url}
            alt={title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      );
    }

    if (contentType === 'audio') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50 p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Volume2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            </div>
            <audio
              controls
              className="w-full"
              onLoadedData={handleIframeLoad}
              onError={handleIframeError}
            >
              <source src={url} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      );
    }

    if (contentType === 'video') {
      return (
        <div className="flex-1 flex items-center justify-center bg-black p-4">
          <video
            controls
            className="max-w-full max-h-full rounded-lg"
            onLoadedData={handleIframeLoad}
            onError={handleIframeError}
          >
            <source src={url} />
            Your browser does not support the video element.
          </video>
        </div>
      );
    }

    // Default: iframe for web content
    return (
      <iframe
        ref={iframeRef}
        src={getEmbedUrl()}
        className="flex-1 w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title={title}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        className={`bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen 
            ? 'w-full h-full rounded-none' 
            : 'w-[95vw] h-[90vh] max-w-6xl'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 bg-white ${
          isFullscreen ? 'absolute top-0 left-0 right-0 z-10 bg-opacity-95 backdrop-blur-sm' : ''
        }`}>
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${getTypeColor()}`}>
              {getTypeIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{title}</h2>
              <p className="text-sm text-gray-600 truncate">{url}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>

            {/* External Link */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Open in New Tab"
            >
              <ExternalLink className="h-5 w-5" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading content...</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className={`flex flex-col ${isFullscreen ? 'h-full pt-16' : 'h-full'}`}>
          {renderContent()}
        </div>

        {/* Fullscreen Controls Overlay */}
        {isFullscreen && (
          <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg transition-all duration-200"
              title="Exit Fullscreen"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg transition-all duration-200"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}