import { useState, useCallback } from 'react';
import { FaCheck } from "react-icons/fa";
import Modal from '../ui/v-modal';
import { Icon } from '../icons';
import type { IconName } from '../../types';

type FeedbackType = 'feature' | 'bug' | 'improvement';

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FeedbackData {
  type: FeedbackType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  email?: string;
}

const FeatureModal = ({ isOpen, onClose }: FeatureModalProps) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        priority,
        email: email.trim() || undefined,
      };

      // Here you would typically send the data to your API
      console.log('Submitting feedback:', feedbackData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitted(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        handleClose();
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setEmail('');
    setFeedbackType('feature');
    setIsSubmitted(false);
  };

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
      // Reset form when modal closes
      setTimeout(resetForm, 300);
    }
  }, [isSubmitting, onClose]);

  const getFeedbackTypeConfig = (type: FeedbackType) => {
    switch (type) {
      case 'feature':
        return {
          icon: 'lightbulb',
          title: 'Feature Request',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          description: 'Suggest a new feature or enhancement'
        };
      case 'bug':
        return {
          icon: 'bug',
          title: 'Bug Report',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          description: 'Report an issue or problem'
        };
      case 'improvement':
        return {
          icon: 'trending-up',
          title: 'Improvement',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'Suggest improvements to existing features'
        };
    }
  };

  const currentConfig = getFeedbackTypeConfig(feedbackType);

  if (!isOpen) return null;

  return (
    <Modal
      onClose={handleClose}
      position="center"
      childClassName="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${currentConfig.bgColor}`}>
              <Icon name={currentConfig.icon as IconName} className={currentConfig.color} size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Share Your Feedback
              </h2>
              <p className="text-sm text-gray-500">Help us improve your experience</p>
            </div>
          </div>
          {/* <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <Icon name="close" className="text-gray-500" size={20} />
          </button> */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isSubmitted ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                {/* <Icon name="check" className="text-green-600" size={24} /> */}
                <FaCheck className="text-green-600 absolute" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Thank you for your feedback!
              </h3>
              <p className="text-gray-600">
                We've received your {feedbackType} and will review it soon.
              </p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of feedback do you have?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['feature', 'bug', 'improvement'] as FeedbackType[]).map((type) => {
                    const config = getFeedbackTypeConfig(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFeedbackType(type)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          feedbackType === type
                            ? `border-${config.color.split('-')[1]}-300 ${config.bgColor}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name={config.icon as IconName} className={config.color} size={16} />
                          <span className="font-medium text-sm">{config.title}</span>
                        </div>
                        <p className="text-xs text-gray-500">{config.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Brief summary of your ${feedbackType}`}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Provide detailed information about your ${feedbackType}...`}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        priority === level
                          ? level === 'high'
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : level === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                            : 'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                  <span className="text-xs text-gray-500 ml-1">
                    - for follow-up communication
                  </span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    isSubmitting || !title.trim() || !description.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Icon name="send" className="text-white" size={16} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FeatureModal;