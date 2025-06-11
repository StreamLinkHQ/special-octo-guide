import { useState, useEffect } from "react";
import { useUser } from "@civic/auth/react";
import { useWallet } from "@civic/auth-web3/react";
import { CiUser, CiSettings, CiEdit, CiCamera } from "react-icons/ci";
import { IoSunnyOutline, IoCopyOutline } from "react-icons/io5";
import { FaCheck, FaSave } from "react-icons/fa";
import { FiMoon } from "react-icons/fi";
import toast from "react-hot-toast";
import { 
  getDisplayCredentials, 
  getGoogleCredentials, 
  getUserPreferences, 
  saveUserPreferences,
  saveGoogleCredentials 
} from "../utils";
import type { UserPreferences } from "../types/auth";

const UserProfilePage = () => {
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [useGoogleAvatar, setUseGoogleAvatar] = useState(true);
  const [username, setUsername] = useState("");
  const [useGoogleName, setUseGoogleName] = useState(true);
  const [theme, setTheme] = useState("light");
  const [status, setStatus] = useState("available");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const userContext = useUser();
  const wallet = useWallet({ type: "solana" });


  const avatarOptions = [
    "https://res.cloudinary.com/adaeze/image/upload/v1745406833/xgkbh9clm7lwcbb2rm0a.png",
    "https://res.cloudinary.com/adaeze/image/upload/v1745406532/oeqiov1ue5ylpythux6k.png",
    "https://res.cloudinary.com/adaeze/image/upload/v1745404837/vaq22f4hotztogwlnhzq.png",
    "https://res.cloudinary.com/adaeze/image/upload/v1745404827/qm3i1gdx1ub0bvntksiz.png",
    "https://res.cloudinary.com/adaeze/image/upload/v1745404819/zhcxy9szj249qxft2fla.png",
    "https://res.cloudinary.com/adaeze/image/upload/v1745404752/nfpwn5cy2tiklsmg9o5u.png",
    "https://res.cloudinary.com/adaeze/image/upload/v1745404752/nfpwn5cy2tiklsmg9o5u.png",
    "https://res.cloudinary.com/adaeze/image/upload/v1745404741/xio2cl8cj8em9cebtyyb.png",
    "https://res.cloudinary.com/adaeze/image/upload/v1745404621/wwouagdzhxne70kkgaxv.png",
    "https://res.cloudinary.com/adaeze/image/upload/v1745404606/dfzeavyyvmooxyys4knz.png",
    "https://res.cloudinary.com/adaeze/image/upload/v1745917882/ihmztupdw0mgu6ma7v9s.png",
  ];

  const statusOptions = [
    { value: "available", label: "Available", color: "bg-green-500" },
    { value: "busy", label: "Busy", color: "bg-red-500" },
    { value: "away", label: "Away", color: "bg-yellow-500" },
    { value: "invisible", label: "Invisible", color: "bg-gray-500" },
  ];

  // Store Google credentials when user data becomes available
  useEffect(() => {
    if (userContext.user && userContext.user.name && userContext.user.picture) {
      saveGoogleCredentials({
        name: userContext.user.name,
        picture: userContext.user.picture,
        email: userContext.user.email
      });
    }
  }, [userContext.user]);

  useEffect(() => {
    try {
      const savedPreferences = getUserPreferences();
      
      if (savedPreferences) {
        setSelectedAvatar(savedPreferences.selectedAvatar || 0);
        setUseGoogleAvatar(savedPreferences.useGoogleAvatar !== undefined ? savedPreferences.useGoogleAvatar : true);
        setUsername(savedPreferences.username || "");
        setUseGoogleName(savedPreferences.useGoogleName !== undefined ? savedPreferences.useGoogleName : true);
        setTheme(savedPreferences.theme || "light");
        setStatus(savedPreferences.status || "available");
      } else {
        // If no saved preferences, check if we have Google credentials to use as defaults
        const displayCreds = getDisplayCredentials();
        if (displayCreds.hasCustomPreferences === false && displayCreds.name !== 'User') {
          // User has Google credentials but no saved preferences - set smart defaults
          setUseGoogleName(true);
          setUseGoogleAvatar(true);
          console.log("No saved preferences found, using Google credentials as defaults");
        }
      }
    } catch (error) {
      console.error("Error loading preferences from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserProfileToBackend = async () => {
    const avatarUrl = getCurrentAvatar();
    const finalUsername = getCurrentUsername();

    const profileData = {
      username: finalUsername,
      avatarUrl: avatarUrl,
    };

    try {
      setIsSaving(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Profile data to be sent to backend:", profileData);
      console.log("✅ Profile saved successfully to backend (mock)");
      return true;
    } catch (error) {
      console.error("Error saving profile to backend:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    const currentPreferences: UserPreferences = {
      selectedAvatar,
      useGoogleAvatar,
      username,
      useGoogleName,
      theme,
      status,
      lastUpdated: new Date().toISOString(),
    };
    
    saveUserPreferences(currentPreferences);

    const backendSuccess = await saveUserProfileToBackend();

    if (backendSuccess) {
      setIsEditing(false);
    } else {
      toast.error("Error saving profile. Please try again.");
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("address copied");
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  const getCurrentAvatar = () => {
    if (useGoogleAvatar) {
      // First try current user context, then fallback to stored Google credentials
      if (userContext.user?.picture) {
        return userContext.user.picture;
      }
      const displayCreds = getDisplayCredentials();
      if (displayCreds.avatar) {
        return displayCreds.avatar;
      }
    }
    return avatarOptions[selectedAvatar];
  };

  const getCurrentUsername = () => {
    if (useGoogleName) {
      // First try current user context, then fallback to stored Google credentials
      if (userContext.user?.name) {
        return userContext.user.name;
      }
      const displayCreds = getDisplayCredentials();
      return displayCreds.name;
    }
    return username || userContext.user?.name || "Enter username";
  };

  const hasGoogleCredentials = () => {
    const displayCreds = getDisplayCredentials();
    return displayCreds.name !== 'User' || displayCreds.avatar !== null;
  };

  const getGoogleDisplayName = () => {
    if (userContext.user?.name) {
      return userContext.user.name;
    }
    const googleCreds = getGoogleCredentials();
    return googleCreds?.name || "No Google name available";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <p className="text-[#36008D] text-2xl lg:!text-4xl font-bold my-3 font-poppins">
                StreamLink
              </p>
              <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                  <div className="w-24 h-6 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="w-40 h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
                <div className="space-y-4">
                  <div className="w-full h-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <p className="text-[#36008D] text-2xl lg:!text-4xl font-bold my-3 font-poppins">
              StreamLink
            </p>
            {isEditing ? (
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSave size={16} />
                <span>{isSaving ? "Saving..." : "Save Profile"}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <CiEdit size={16} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={getCurrentAvatar()}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-purple-200"
                  />
                  <div
                    className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-3 border-white ${
                      statusOptions.find((s) => s.value === status)?.color
                    }`}
                  ></div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {getCurrentUsername()}
                </h2>
                <p className="text-gray-600 mb-4">
                  @
                  {(getCurrentUsername() ?? "username")
                    .toLowerCase()
                    .replace(/\s+/g, "") || "username"}
                </p>

                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      statusOptions.find((s) => s.value === status)?.color
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {statusOptions.find((s) => s.value === status)?.label}
                  </span>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Wallet Address
                      </span>
                      <button
                        onClick={() => copyText(wallet?.address || "")}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Copy wallet address"
                      >
                        <IoCopyOutline size={16} className="text-gray-600" />
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-800 break-all">
                      {wallet?.address}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <span className="text-sm font-medium text-gray-700 block mb-1">
                      Wallet Balance
                    </span>
                    <div className="text-lg font-bold text-purple-600">
                      2.47 sol
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CiCamera size={20} className="mr-2 text-purple-600" />
                Profile Picture
              </h3>

              <div className="mb-6">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    checked={useGoogleAvatar}
                    onChange={() => setUseGoogleAvatar(true)}
                    className="text-purple-600"
                    disabled={!isEditing}
                  />
                  <img
                    src={getCurrentAvatar()}
                    alt="Google"
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      Use Google Profile Picture
                    </div>
                    <div className="text-sm text-gray-600">
                      {userContext.user?.picture ? "From your Google account" : "From saved Google credentials"}
                      {!userContext.user?.picture && hasGoogleCredentials() && (
                        <span className="text-gray-500 ml-1">(saved)</span>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Or choose a custom avatar:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {avatarOptions.map((avatar, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (isEditing) {
                          setSelectedAvatar(index);
                          setUseGoogleAvatar(false);
                        }
                      }}
                      disabled={!isEditing}
                      className={`relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                        selectedAvatar === index && !useGoogleAvatar
                          ? "border-purple-500 ring-2 ring-purple-200"
                          : "border-gray-200 hover:border-purple-300"
                      } ${
                        !isEditing
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedAvatar === index && !useGoogleAvatar && (
                        <div className="absolute inset-0 bg-purple-600 bg-opacity-20 flex items-center justify-center">
                          <FaCheck size={16} className="text-purple-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CiUser size={20} className="mr-2 text-purple-600" />
                Username
              </h3>

              <div className="mb-4">
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    checked={useGoogleName}
                    onChange={() => setUseGoogleName(true)}
                    className="text-purple-600"
                    disabled={!isEditing}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      Use Google Name
                    </div>
                    <div className="text-sm text-gray-600">
                      {getGoogleDisplayName()}
                      {!userContext.user?.name && hasGoogleCredentials() && (
                        <span className="text-gray-500 ml-1">(saved)</span>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <input
                    type="radio"
                    checked={!useGoogleName}
                    onChange={() => setUseGoogleName(false)}
                    className="text-purple-600"
                    disabled={!isEditing}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">
                      Custom Username
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      disabled={!isEditing || useGoogleName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CiSettings size={20} className="mr-2 text-purple-600" />
                Preferences
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Availability Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => isEditing && setStatus(option.value)}
                        disabled={!isEditing}
                        className={`flex items-center space-x-3 p-3 border rounded-lg transition-all ${
                          status === option.value
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                        } ${
                          !isEditing
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${option.color}`}
                        ></div>
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme Preference
                  </label>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => isEditing && setTheme("light")}
                      disabled={!isEditing}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all ${
                        theme === "light"
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-700 hover:border-purple-300"
                      } ${
                        !isEditing
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <IoSunnyOutline size={16} />
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => isEditing && setTheme("dark")}
                      disabled={!isEditing}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all ${
                        theme === "dark"
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-700 hover:border-purple-300"
                      } ${
                        !isEditing
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <FiMoon size={16} />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;