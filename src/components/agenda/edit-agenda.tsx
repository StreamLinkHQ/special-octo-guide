import { useState } from 'react';
import { useUpdateStreamAgenda, useRequirePublicKey, type Agenda } from '@vidbloq/react';

interface EditAgendaModalProps {
  agenda: Agenda;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAgendaModal = ({ agenda, onClose, onSuccess }: EditAgendaModalProps) => {
  const [title, setTitle] = useState(agenda.title || '');
  const [description, setDescription] = useState(agenda.description || '');
  const [duration, setDuration] = useState(agenda.duration?.toString() || '');
  // const [timeStamp, setTimeStamp] = useState(agenda.timeStamp.toString());
  
  const { updateStreamAgenda, isLoading } = useUpdateStreamAgenda();
  const { publicKey } = useRequirePublicKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) return;

    const result = await updateStreamAgenda(agenda.id, {
      wallet: publicKey.toString(),
      title,
      description,
      // duration: duration ? parseInt(duration) : undefined,
      isCompleted: false,
      // timeStamp: parseInt(timeStamp),
    });

    if (result) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[500px] max-w-[90%]">
        <h2 className="text-xl font-semibold mb-4">Edit Agenda Item</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Stamp (minutes)
            </label>
            <input
              type="number"
              value={agenda.timeStamp}
              disabled
              // onChange={(e) => setTimeStamp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="1"
              placeholder="Optional"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAgendaModal;