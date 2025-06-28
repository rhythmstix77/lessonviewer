import React, { useState } from 'react';
import { Calendar, X, Check, ChevronRight } from 'lucide-react';

interface HalfTerm {
  id: string;
  name: string;
  months: string;
}

interface AssignToHalfTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (halfTermId: string) => void;
  lessonNumber: string;
  halfTerms: HalfTerm[];
}

export function AssignToHalfTermModal({
  isOpen,
  onClose,
  onAssign,
  lessonNumber,
  halfTerms
}: AssignToHalfTermModalProps) {
  const [selectedHalfTerm, setSelectedHalfTerm] = useState<string>('');

  if (!isOpen) return null;

  console.log('AssignToHalfTermModal rendered', { lessonNumber, halfTerms });

  const handleAssign = () => {
    console.log('Assigning to half-term:', selectedHalfTerm);
    if (selectedHalfTerm) {
      onAssign(selectedHalfTerm);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Assign Lesson to Half-Term</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Select a half-term to assign Lesson {lessonNumber}. This will help organize your lessons in the academic calendar.
          </p>

          <div className="space-y-2 mb-6">
            {halfTerms.map(halfTerm => (
              <button
                key={halfTerm.id}
                onClick={() => setSelectedHalfTerm(halfTerm.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors duration-200 ${
                  selectedHalfTerm === halfTerm.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    halfTerm.id.startsWith('A') ? 'bg-amber-500' :
                    halfTerm.id.startsWith('SP') ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div className="text-left">
                    <p className="font-medium">{halfTerm.name}</p>
                    <p className="text-xs text-gray-500">{halfTerm.months}</p>
                  </div>
                </div>
                {selectedHalfTerm === halfTerm.id && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedHalfTerm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Assign to {selectedHalfTerm ? halfTerms.find(ht => ht.id === selectedHalfTerm)?.name : 'Half-Term'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}