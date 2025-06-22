import React, { useState } from 'react';
import { X, Clock, Video, Music, FileText, Link as LinkIcon, Image, Volume2 } from 'lucide-react';
import { LinkViewer } from './LinkViewer';
import { EditableText } from './EditableText';
import type { Activity } from '../contexts/DataContext';

interface ActivityDetailsProps {
  activity: Activity;
  onClose: () => void;
}

export function ActivityDetails({ activity, onClose }: ActivityDetailsProps) {
  const [selectedLink, setSelectedLink] = useState<{ url: string; title: string; type: string } | null>(null);

  const renderDescription = () => {
    if (activity.htmlDescription) {
      // Render HTML description with basic formatting
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: activity.htmlDescription }}
        />
      );
    }
    
    // Render plain text with markdown-style formatting
    const formattedDescription = activity.description
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<u>$1</u>')
      .replace(/\n/g, '<br>');
    
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: formattedDescription }}
      />
    );
  };

  const resources = [
    { label: 'Video', url: activity.videoLink, icon: Video, color: 'text-red-600 bg-red-50 border-red-200', type: 'video' },
    { label: 'Music', url: activity.musicLink, icon: Music, color: 'text-green-600 bg-green-50 border-green-200', type: 'music' },
    { label: 'Backing', url: activity.backingLink, icon: Volume2, color: 'text-blue-600 bg-blue-50 border-blue-200', type: 'backing' },
    { label: 'Resource', url: activity.resourceLink, icon: FileText, color: 'text-purple-600 bg-purple-50 border-purple-200', type: 'resource' },
    { label: 'Link', url: activity.link, icon: LinkIcon, color: 'text-gray-600 bg-gray-50 border-gray-200', type: 'link' },
    { label: 'Vocals', url: activity.vocalsLink, icon: Volume2, color: 'text-orange-600 bg-orange-50 border-orange-200', type: 'vocals' },
    { label: 'Image', url: activity.imageLink, icon: Image, color: 'text-pink-600 bg-pink-50 border-pink-200', type: 'image' },
  ].filter(resource => resource.url && resource.url.trim());

  const handleResourceClick = (resource: any) => {
    setSelectedLink({
      url: resource.url,
      title: `${activity.activity} - ${resource.label}`,
      type: resource.type
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activity.activity}</h2>
              <div className="flex items-center space-x-3 mt-1">
                <p className="text-sm text-gray-600">{activity.category}</p>
                {activity.level && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {activity.level}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Time */}
            {activity.time > 0 && (
              <div className="flex items-center space-x-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  <EditableText 
                    id="activity-duration-label" 
                    fallback="Duration: {time} minutes"
                    className="text-sm font-medium text-blue-900"
                  />
                  {activity.time} minutes
                </span>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                <EditableText 
                  id="activity-description-heading" 
                  fallback="Description"
                />
              </h3>
              <div className="text-gray-700 leading-relaxed">
                {renderDescription()}
              </div>
            </div>

            {/* Unit Name */}
            {activity.unitName && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <EditableText 
                    id="activity-unit-heading" 
                    fallback="Unit"
                  />
                </h3>
                <p className="text-gray-700">{activity.unitName}</p>
              </div>
            )}

            {/* Resources */}
            {resources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <EditableText 
                    id="activity-resources-heading" 
                    fallback="Resources"
                  />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {resources.map((resource, index) => {
                    const IconComponent = resource.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleResourceClick(resource)}
                        className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${resource.color}`}
                      >
                        <IconComponent className="h-6 w-6 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900">{resource.label}</p>
                          <p className="text-xs text-gray-600 truncate max-w-[150px]">
                            {resource.url}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {resources.length === 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  <EditableText 
                    id="activity-no-resources-message" 
                    fallback="No additional resources available"
                  />
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <EditableText 
                id="activity-close-button" 
                fallback="Close"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Link Viewer Modal */}
      {selectedLink && (
        <LinkViewer
          url={selectedLink.url}
          title={selectedLink.title}
          type={selectedLink.type as any}
          onClose={() => setSelectedLink(null)}
        />
      )}
    </>
  );
}