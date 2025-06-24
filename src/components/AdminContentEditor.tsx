import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Edit3, 
  Save, 
  X, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Link,
  Image,
  Undo,
  Redo
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface EditableContent {
  id: string;
  label: string;
  content: string;
  type: 'text' | 'html' | 'title' | 'description';
  category: string;
}

interface AdminContentEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminContentEditor({ isOpen, onClose }: AdminContentEditorProps) {
  const { user } = useAuth();
  const [selectedContent, setSelectedContent] = useState<EditableContent | null>(null);
  const [editableContents, setEditableContents] = useState<EditableContent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeButtons, setActiveButtons] = useState<string[]>([]);

  // Check if user is admin
  const isAdmin = user?.email === 'admin@rhythmstix.co.uk' || 
                  user?.email === 'admin@example.com' || 
                  user?.role === 'administrator' ||
                  user?.role === 'admin';

  // Don't render if user is not admin
  if (!isAdmin || !isOpen) {
    return null;
  }

  // Initialize editable content from localStorage or defaults
  useEffect(() => {
    const savedContent = localStorage.getItem('admin-editable-content');
    if (savedContent) {
      setEditableContents(JSON.parse(savedContent));
    } else {
      // Default content structure
      const defaultContent: EditableContent[] = [
        {
          id: 'app-title',
          label: 'Application Title',
          content: 'RhythmStix Lesson Viewer',
          type: 'title',
          category: 'Header'
        },
        {
          id: 'welcome-message',
          label: 'Welcome Message',
          content: 'Welcome to your music lesson planning system',
          type: 'text',
          category: 'General'
        },
        {
          id: 'lesson-description-template',
          label: 'Lesson Description Template',
          content: '<p>This is a <strong>sample lesson description</strong> that can include:</p><ul><li>Bold text for emphasis</li><li>Bullet points for activities</li><li>Numbered lists for steps</li></ul><p><em>Italic text</em> for notes and <u>underlined text</u> for important information.</p>',
          type: 'html',
          category: 'Lessons'
        },
        {
          id: 'footer-tagline',
          label: 'Footer Tagline',
          content: 'Performing Arts',
          type: 'text',
          category: 'Footer'
        },
        {
          id: 'login-instructions',
          label: 'Login Instructions',
          content: 'Sign in with your WordPress account to access lesson plans',
          type: 'text',
          category: 'Authentication'
        },
        {
          id: 'activity-instructions',
          label: 'Activity Instructions Template',
          content: '<h3>Activity Instructions</h3><ol><li>First, gather all materials needed</li><li>Explain the activity to students</li><li>Demonstrate the movements or actions</li><li>Allow students to practice</li><li>Provide feedback and encouragement</li></ol><p><strong>Safety Note:</strong> Always ensure adequate space for movement activities.</p>',
          type: 'html',
          category: 'Activities'
        }
      ];
      setEditableContents(defaultContent);
      localStorage.setItem('admin-editable-content', JSON.stringify(defaultContent));
    }
  }, []);

  // Set up event listeners for selection changes to update active buttons
  useEffect(() => {
    if (selectedContent && editorRef.current) {
      const handleSelectionChange = () => {
        const activeCommands: string[] = [];
        
        if (document.queryCommandState('bold')) activeCommands.push('bold');
        if (document.queryCommandState('italic')) activeCommands.push('italic');
        if (document.queryCommandState('underline')) activeCommands.push('underline');
        if (document.queryCommandState('insertUnorderedList')) activeCommands.push('insertUnorderedList');
        if (document.queryCommandState('insertOrderedList')) activeCommands.push('insertOrderedList');
        if (document.queryCommandState('justifyLeft')) activeCommands.push('justifyLeft');
        if (document.queryCommandState('justifyCenter')) activeCommands.push('justifyCenter');
        if (document.queryCommandState('justifyRight')) activeCommands.push('justifyRight');
        
        setActiveButtons(activeCommands);
      };
      
      document.addEventListener('selectionchange', handleSelectionChange);
      
      // Focus the editor
      editorRef.current.focus();
      
      // Clean up
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, [selectedContent]);

  // Save content to localStorage
  const saveContent = () => {
    localStorage.setItem('admin-editable-content', JSON.stringify(editableContents));
  };

  // Rich text editor commands
  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      // Focus the editor to ensure commands work properly
      editorRef.current.focus();
      
      // Save the current selection
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      // Execute the command
      document.execCommand(command, false, value);
      
      // Update active buttons state
      if (activeButtons.includes(command)) {
        setActiveButtons(prev => prev.filter(cmd => cmd !== command));
      } else {
        setActiveButtons(prev => [...prev, command]);
      }
      
      if (editorRef.current && selectedContent) {
        const updatedContent = editorRef.current.innerHTML;
        setSelectedContent({ ...selectedContent, content: updatedContent });
      }
      
      // Restore focus to the editor
      editorRef.current.focus();
      
      // Restore selection if possible
      if (range && selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  // Handle content save
  const handleSaveContent = () => {
    if (selectedContent && editorRef.current) {
      const updatedContent = editorRef.current.innerHTML;
      const updatedContents = editableContents.map(content =>
        content.id === selectedContent.id
          ? { ...content, content: updatedContent }
          : content
      );
      setEditableContents(updatedContents);
      localStorage.setItem('admin-editable-content', JSON.stringify(updatedContents));
      setSelectedContent(null);
    }
  };

  // Filter content based on search and category
  const filteredContent = editableContents.filter(content => {
    const matchesSearch = content.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || content.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(editableContents.map(c => c.category)))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center space-x-3">
            <Edit3 className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Content Management System</h2>
              <p className="text-blue-100 text-sm">Admin Access - Edit all text content</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-blue-100 hover:text-white hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Content List Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Search and Filter */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mb-3"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto">
              {filteredContent.map((content) => (
                <button
                  key={content.id}
                  onClick={() => setSelectedContent(content)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-blue-50 transition-colors duration-200 ${
                    selectedContent?.id === content.id ? 'bg-blue-100 border-blue-300' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">
                        {content.label}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">{content.category}</p>
                      <div 
                        className="text-xs text-gray-500 line-clamp-2"
                        dangerouslySetInnerHTML={{ 
                          __html: content.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' 
                        }}
                      />
                    </div>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                      content.type === 'html' ? 'bg-purple-100 text-purple-800' :
                      content.type === 'title' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {content.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor Panel */}
          <div className="flex-1 flex flex-col">
            {selectedContent ? (
              <>
                {/* Editor Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedContent.label}</h3>
                      <p className="text-sm text-gray-600">{selectedContent.category} • {selectedContent.type}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedContent(null)}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveContent}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>

                  {/* Rich Text Toolbar */}
                  {selectedContent.type === 'html' && (
                    <div className="flex flex-wrap items-center space-x-1 p-2 bg-white border border-gray-300 rounded-lg">
                      <button
                        onClick={() => execCommand('undo')}
                        className="p-2 hover:bg-gray-100 rounded transition-colors duration-200"
                        title="Undo"
                      >
                        <Undo className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => execCommand('redo')}
                        className="p-2 hover:bg-gray-100 rounded transition-colors duration-200"
                        title="Redo"
                      >
                        <Redo className="h-4 w-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-gray-300 mx-2"></div>
                      
                      <button
                        onClick={() => execCommand('bold')}
                        className={`p-2 rounded transition-colors duration-200 ${
                          activeButtons.includes('bold') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'
                        }`}
                        title="Bold"
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => execCommand('italic')}
                        className={`p-2 rounded transition-colors duration-200 ${
                          activeButtons.includes('italic') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'
                        }`}
                        title="Italic"
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => execCommand('underline')}
                        className={`p-2 rounded transition-colors duration-200 ${
                          activeButtons.includes('underline') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'
                        }`}
                        title="Underline"
                      >
                        <Underline className="h-4 w-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-gray-300 mx-2"></div>
                      
                      <button
                        onClick={() => execCommand('insertUnorderedList')}
                        className={`p-2 rounded transition-colors duration-200 ${
                          activeButtons.includes('insertUnorderedList') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'
                        }`}
                        title="Bullet List"
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => execCommand('insertOrderedList')}
                        className={`p-2 rounded transition-colors duration-200 ${
                          activeButtons.includes('insertOrderedList') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'
                        }`}
                        title="Numbered List"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-gray-300 mx-2"></div>
                      
                      <button
                        onClick={() => execCommand('justifyLeft')}
                        className={`p-2 rounded transition-colors duration-200 ${
                          activeButtons.includes('justifyLeft') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'
                        }`}
                        title="Align Left"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => execCommand('justifyCenter')}
                        className={`p-2 rounded transition-colors duration-200 ${
                          activeButtons.includes('justifyCenter') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'
                        }`}
                        title="Align Center"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => execCommand('justifyRight')}
                        className={`p-2 rounded transition-colors duration-200 ${
                          activeButtons.includes('justifyRight') ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100'
                        }`}
                        title="Align Right"
                      >
                        <AlignRight className="h-4 w-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-gray-300 mx-2"></div>
                      
                      <select
                        onChange={(e) => execCommand('formatBlock', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded"
                        defaultValue=""
                      >
                        <option value="">Format</option>
                        <option value="<h1>">Heading 1</option>
                        <option value="<h2>">Heading 2</option>
                        <option value="<h3>">Heading 3</option>
                        <option value="<p>">Paragraph</option>
                      </select>
                      
                      <input
                        type="color"
                        onChange={(e) => execCommand('foreColor', e.target.value)}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        title="Text Color"
                      />
                    </div>
                  )}
                </div>

                {/* Editor Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {selectedContent.type === 'html' ? (
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[400px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedContent.content }}
                      onInput={(e) => {
                        const target = e.target as HTMLDivElement;
                        setSelectedContent({ ...selectedContent, content: target.innerHTML });
                      }}
                      onKeyDown={(e) => {
                        // Prevent default behavior for Tab key to avoid losing focus
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                        }
                      }}
                    />
                  ) : (
                    <textarea
                      value={selectedContent.content}
                      onChange={(e) => setSelectedContent({ ...selectedContent, content: e.target.value })}
                      className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                      placeholder="Enter your content here..."
                    />
                  )}
                  
                  {/* Preview */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedContent.content }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Edit3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select Content to Edit</h3>
                  <p className="text-gray-600">Choose an item from the list to start editing</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{editableContents.length}</span> content items • 
            <span className="font-medium"> {filteredContent.length}</span> shown
          </div>
          <div className="flex space-x-3">
            <button
              onClick={saveContent}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save All Changes</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}