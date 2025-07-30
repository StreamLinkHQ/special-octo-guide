import { useState, useCallback } from 'react';
import { useRequirePublicKey } from '@vidbloq/react';

type FeedbackType = 'feature' | 'bug' | 'improvement';

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
}

interface FeedbackData {
  type: FeedbackType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  email?: string;
  timestamp?: string;
  wallet?: string;
}

// Google Sheets configuration
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyw1Bxvtwp4SPZqy3X5Vpd55Vx7gZ51qJP16MddJBhqGr7lvPxQT9wIl_6ni5k_iqyz/exec'; // Replace with your actual URL

const FeatureModal = ({ isOpen, onClose }: FeatureModalProps) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { publicKey: walletAddress } = useRequirePublicKey();

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const feedbackData: FeedbackData = {
        type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        priority,
        email: email.trim() || undefined,
        timestamp: new Date().toISOString(),
        wallet: walletAddress?.toString() || ''
      };

      // Submit to Google Sheets
      const formData = new FormData();
      formData.append('type', feedbackData.type);
      formData.append('title', feedbackData.title);
      formData.append('description', feedbackData.description);
      formData.append('priority', feedbackData.priority);
      formData.append('email', feedbackData.email || '');
      formData.append('timestamp', feedbackData.timestamp || '');
      formData.append('wallet', feedbackData.wallet || '');

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setIsSubmitted(true);
        
        // Reset form after successful submission
        setTimeout(() => {
          handleClose();
          resetForm();
        }, 2000);
      } else {
        throw new Error(result.message || 'Submission failed');
      }

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
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
    setError('');
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
          icon: '💡',
          title: 'Feature Request',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300',
          description: 'Suggest a new feature'
        };
      case 'bug':
        return {
          icon: '🐛',
          title: 'Bug Report',
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          description: 'Report an issue'
        };
      case 'improvement':
        return {
          icon: '📈',
          title: 'Improvement',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          description: 'Suggest improvements'
        };
    }
  };

  const currentConfig = getFeedbackTypeConfig(feedbackType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95%] sm:max-w-[90%] md:max-w-[600px] lg:max-w-[650px] max-h-[90vh] overflow-hidden animate-fadeIn">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header - Responsive padding and text sizes */}
          <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-full ${currentConfig.bgColor}`}>
                <span className="text-base sm:text-lg">{currentConfig.icon}</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Share Your Feedback
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  Help us improve your experience
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1"
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content - Scrollable with responsive padding */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6">
            {isSubmitted ? (
              /* Success State */
              <div className="text-center py-6 sm:py-8">
                <div className="bg-green-100 p-3 sm:p-4 rounded-full w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">✓</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                  Thank you for your feedback!
                </h3>
                <p className="text-sm sm:text-base text-gray-600 px-4">
                  We've received your {feedbackType} and will review it soon.
                </p>
              </div>
            ) : (
              /* Form */
              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Feedback Type Selection - Responsive grid */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    What type of feedback do you have?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    {(['feature', 'bug', 'improvement'] as FeedbackType[]).map((type) => {
                      const config = getFeedbackTypeConfig(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFeedbackType(type)}
                          className={`p-2.5 sm:p-3 rounded-lg border-2 transition-all text-left ${
                            feedbackType === type
                              ? `${config.borderColor} ${config.bgColor}`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <span className="text-sm sm:text-base">{config.icon}</span>
                            <span className="font-medium text-xs sm:text-sm">{config.title}</span>
                          </div>
                          <p className="text-xs text-gray-500 hidden sm:block">{config.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`Brief summary of your ${feedbackType}`}
                    className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Description - Responsive textarea height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`Provide detailed information about your ${feedbackType}...`}
                    rows={3}
                    className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Priority - Responsive button sizes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Priority
                  </label>
                  <div className="flex gap-1.5 sm:gap-2">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setPriority(level)}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-initial ${
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Email
                    <span className="text-xs text-gray-500 ml-1 hidden sm:inline">
                      (Optional - for follow-up)
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Submit Buttons - Responsive layout */}
                <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !title.trim() || !description.trim()}
                    className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                      isSubmitting || !title.trim() || !description.trim()
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Submitting...</span>
                        <span className="sm:hidden">Submit...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm">📤</span>
                        <span className="hidden sm:inline">Submit Feedback</span>
                        <span className="sm:hidden">Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureModal;