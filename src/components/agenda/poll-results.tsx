// import React, { useState, useEffect } from "react";
// import { 
//   FaChartPie, 
//   FaChartBar,
//   FaTrophy,
//   FaUsers,
// } from "react-icons/fa";
// import { MdOutlineFileDownload } from "react-icons/md";
// import { FiFileText, FiTrendingUp } from "react-icons/fi";
// import { useGetPollResults } from "@vidbloq/react";
// import { useStream } from "../../hooks"; // Using the proper hook

// interface PollResultsProps {
//   agendaId: string;
//   onRefresh?: () => void;
// }

// const PollResults: React.FC<PollResultsProps> = ({ 
//   agendaId,
//   onRefresh
// }) => {
//   const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
//   const { getPollResults, isLoading: isLoadingFromHook, results: hookResults } = useGetPollResults();
  
//   // Use the stream context properly with useStream hook
//   const { 
//     getResponseData, 
//     isResponseDataLoading, 
//     preloadResponseData, 
//     clearResponseCache 
//   } = useStream();
  
//   // Check for cached data
//   const cachedData = getResponseData(agendaId, 'poll');
//   const isCacheLoading = isResponseDataLoading(agendaId);
  
//   // Use cached data if available, otherwise use hook results
//   const results = cachedData || hookResults;
//   const isLoading = isCacheLoading || (isLoadingFromHook && !cachedData);
  
//   // Track if we've fetched for this agenda
//   const [hasFetched, setHasFetched] = useState(false);

//   useEffect(() => {
//     if (agendaId && !cachedData && !hasFetched && !isCacheLoading) {
//       // No cached data and haven't fetched yet, fetch now
//       fetchPollResults();
//       setHasFetched(true);
//     } else if (cachedData) {
//       // We have cached data, no need to fetch
//       console.log('Using cached poll results for agenda:', agendaId);
//       setHasFetched(true);
//     }
//   }, [agendaId, cachedData, hasFetched, isCacheLoading]);

//   const fetchPollResults = async () => {
//     try {
//       console.log('Fetching fresh poll results for agenda:', agendaId);
//       await getPollResults(agendaId);
      
//       // After fetching, update the cache if no cached data exists
//       if (!cachedData) {
//         // The hook has fetched new data, trigger cache update
//         preloadResponseData(agendaId, 'poll');
//       }
//     } catch (error) {
//       console.error("Error fetching poll results:", error);
//     }
//   };

//   const handleRefresh = async () => {
//     // Clear cache for this agenda and refetch
//     clearResponseCache(agendaId);
//     setHasFetched(false);
//     await fetchPollResults();
//     if (onRefresh) {
//       onRefresh();
//     }
//   };

//   const calculatePercentage = (votes: number, total: number): number => {
//     return total > 0 ? Math.round((votes / total) * 100) : 0;
//   };

//   const getTopChoice = (): { option: string; votes: number; percentage: number } | null => {
//     if (!results) return null;
    
//     let topOption = '';
//     let maxVotes = 0;
    
//     Object.entries(results.voteCounts).forEach(([option, votes]) => {
//       if ((votes as number) > maxVotes) {
//         maxVotes = votes as number;
//         topOption = option;
//       }
//     });
    
//     return {
//       option: topOption,
//       votes: maxVotes,
//       percentage: calculatePercentage(maxVotes, results.totalVotes)
//     };
//   };

//   const getColorForOption = (index: number): string => {
//     const colors = [
//       "from-purple-400 to-purple-600",
//       "from-blue-400 to-blue-600",
//       "from-green-400 to-green-600",
//       "from-yellow-400 to-yellow-600",
//       "from-pink-400 to-pink-600",
//       "from-indigo-400 to-indigo-600"
//     ];
//     return colors[index % colors.length];
//   };

//   const downloadPollResults = (): void => {
//     if (!results) return;

//     const csvHeader = ['Option', 'Votes', 'Percentage'].join(',');
//     const csvData = Object.entries(results.voteCounts).map(([option, votes]) => [
//       `"${option}"`,
//       votes,
//       `${calculatePercentage(votes as number, results.totalVotes)}%`
//     ].join(','));

//     const csvContent = [
//       `Poll: ${results.title || 'Untitled Poll'}`,
//       `Total Votes: ${results.totalVotes}`,
//       `Generated: ${new Date().toLocaleString()}`,
//       '',
//       csvHeader,
//       ...csvData
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const link = document.createElement("a");
//     const url = URL.createObjectURL(blob);

//     link.setAttribute("href", url);
//     link.setAttribute(
//       "download",
//       `${(results.title || "Poll").replace(/\s+/g, "_")}_Results_${new Date().toISOString().split("T")[0]}.csv`
//     );
//     link.style.visibility = "hidden";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const downloadDetailedReport = (): void => {
//     if (!results) return;

//     const topChoice = getTopChoice();
//     const sortedResults = Object.entries(results.voteCounts)
//       .sort(([,a], [,b]) => (b as number) - (a as number));

//     const reportContent = `
// POLL RESULTS REPORT
// ==================
// Poll: ${results.title || "Untitled Poll"}
// Generated: ${new Date().toLocaleString()}
// Total Votes: ${results.totalVotes}
// ${cachedData ? 'Data Source: Cached' : 'Data Source: Live'}

// WINNING OPTION
// =============
// ${topChoice ? `${topChoice.option} (${topChoice.votes} votes, ${topChoice.percentage}%)` : 'No votes recorded'}

// DETAILED RESULTS
// ===============
// ${sortedResults.map(([option, votes], index) => {
//   const percentage = calculatePercentage(votes as number, results.totalVotes);
//   const rank = index + 1;
//   return `${rank}. ${option}
//    Votes: ${votes} (${percentage}%)
//    Progress: ${'█'.repeat(Math.floor(percentage / 5))}${' '.repeat(20 - Math.floor(percentage / 5))} ${percentage}%`;
// }).join('\n\n')}

// SUMMARY STATISTICS
// =================
// Average votes per option: ${Math.round(results.totalVotes / results.options.length)}
// Most popular option: ${topChoice?.option || 'N/A'}
// Total options: ${results.options.length}
//     `.trim();

//     const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8;" });
//     const link = document.createElement("a");
//     const url = URL.createObjectURL(blob);

//     link.setAttribute("href", url);
//     link.setAttribute(
//       "download",
//       `${(results.title || "Poll").replace(/\s+/g, "_")}_Detailed_Report_${new Date().toISOString().split("T")[0]}.txt`
//     );
//     link.style.visibility = "hidden";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
//         <div className="max-w-4xl mx-auto">
//           <div className="animate-pulse">
//             <div className="h-8 bg-purple-200 rounded-lg mb-4"></div>
//             <div className="h-32 bg-purple-100 rounded-xl mb-6"></div>
//             <div className="space-y-4">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="h-16 bg-purple-50 rounded-xl"></div>
//               ))}
//             </div>
//           </div>
//           {cachedData && (
//             <div className="mt-4 text-center text-sm text-purple-600">
//               Loading fresh data...
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }

//   if (!results) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
//         <div className="max-w-4xl mx-auto">
//           <div className="text-center py-12 bg-white rounded-3xl shadow-xl border border-purple-100">
//             <FaChartBar className="w-16 h-16 text-purple-300 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-gray-600 mb-2">
//               No Poll Results Found
//             </h2>
//             <p className="text-gray-500">
//               Unable to load poll results at this time.
//             </p>
//             <button
//               onClick={handleRefresh}
//               className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
//             >
//               Try Again
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const topChoice = getTopChoice();
//   const sortedOptions = Object.entries(results.voteCounts)
//     .sort(([,a], [,b]) => (b as number) - (a as number));

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 relative overflow-hidden">
//       {/* Background decoration */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
//         <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
//       </div>

//       <div className="relative max-w-4xl mx-auto p-8">
//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
//             <div>
//               <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent mb-3">
//                 {results.title || "Poll Results"}
//               </h1>
//               <div className="flex flex-wrap gap-6 text-sm text-gray-600">
//                 <div className="flex items-center gap-2">
//                   <FaUsers className="w-4 h-4 text-purple-500" />
//                   <span>
//                     <span className="font-semibold text-purple-700">{results.totalVotes}</span> total votes
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <FaChartPie className="w-4 h-4 text-purple-500" />
//                   <span>
//                     <span className="font-semibold text-purple-700">{results.options.length}</span> options
//                   </span>
//                 </div>
//                 {cachedData && (
//                   <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
//                     <span>✓ Cached</span>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Actions */}
//              <div className="flex flex-row gap-2 sm:gap-3 mt-4 lg:mt-0">
//               <button
//                 onClick={downloadPollResults}
//                 className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs sm:text-sm"
//               >
//              <MdOutlineFileDownload className="w-3 h-3 sm:w-4 sm:h-4" />
//                <span className="hidden sm:inline">Download</span> CSV
//               </button>
//               <button
//                 onClick={downloadDetailedReport}
//                 className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs sm:text-sm"
//               >
//                   <FiFileText className="w-3 h-3 sm:w-4 sm:h-4" />
//                                <span className="hidden sm:inline">Full</span> Report
//               </button>
//               <button
//                 onClick={handleRefresh}
//                   className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg sm:rounded-xl hover:bg-purple-50 hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs sm:text-sm"
//               >
//                 <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
//                 Refresh
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Winner Highlight */}
//         {topChoice && results.totalVotes > 0 && (
//           <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8 shadow-lg relative overflow-hidden">
//             <div className="absolute -top-2 -right-2 w-16 h-16 bg-yellow-400 rounded-full opacity-30 animate-pulse"></div>
//             <div className="flex items-center relative">
//               <FaTrophy className="w-10 h-10 text-yellow-600 mr-4" />
//               <div className="flex-1">
//                 <h2 className="text-xl font-bold text-yellow-900 mb-1">
//                   Winning Option
//                 </h2>
//                 <p className="text-yellow-800 text-lg font-medium mb-2">{topChoice.option}</p>
//                 <div className="flex items-center gap-4 text-sm">
//                   <span className="font-bold text-yellow-900 text-lg">
//                     {topChoice.votes} votes ({topChoice.percentage}%)
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* View Mode Toggle */}
//         <div className="mb-6">
//           <div className="border-b border-purple-200">
//             <nav className="-mb-px flex space-x-8">
//               <button
//                 onClick={() => setViewMode("chart")}
//                 className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
//                   viewMode === "chart"
//                     ? "border-purple-500 text-purple-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 <FaChartBar className="w-4 h-4" />
//                 Chart View
//               </button>
//               <button
//                 onClick={() => setViewMode("table")}
//                 className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
//                   viewMode === "table"
//                     ? "border-purple-500 text-purple-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 <FiFileText className="w-4 h-4" />
//                 Table View
//               </button>
//             </nav>
//           </div>
//         </div>

//         {/* Results Display */}
//         <div className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
//           {viewMode === "chart" ? (
//             <div className="p-8">
//               <h2 className="text-xl font-bold text-purple-800 mb-6">
//                 Vote Distribution
//               </h2>
//               <div className="space-y-6">
//                 {sortedOptions.map(([option, votes], index) => {
//                   const percentage = calculatePercentage(votes as number, results.totalVotes);
//                   const isWinner = index === 0 && (votes as number) > 0;

//                   return (
//                     <div key={option} className="space-y-3 group">
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center space-x-3">
//                           <span
//                             className={`text-sm font-bold px-3 py-1 rounded-lg ${
//                               isWinner
//                                 ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300"
//                                 : "bg-purple-50 text-purple-700 border border-purple-200"
//                             }`}
//                           >
//                             #{index + 1}
//                           </span>
//                           <h3 className="font-semibold text-gray-900 text-lg">{option}</h3>
//                         </div>
//                         <div className="text-right">
//                           <div className="text-2xl font-bold text-purple-700">
//                             {votes as number}
//                           </div>
//                           <div className="text-sm text-gray-500 font-medium">{percentage}%</div>
//                         </div>
//                       </div>
//                       <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
//                         <div
//                           className={`h-4 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${
//                             isWinner
//                               ? "from-yellow-400 to-amber-500 shadow-yellow-300"
//                               : getColorForOption(index)
//                           } shadow-sm`}
//                           style={{ width: `${percentage}%` }}
//                         ></div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-purple-200">
//                 <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
//                       Rank
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
//                       Option
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
//                       Votes
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
//                       Percentage
//                     </th>
//                     <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
//                       Visual
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-100">
//                   {sortedOptions.map(([option, votes], index) => {
//                     const percentage = calculatePercentage(votes as number, results.totalVotes);
//                     const isWinner = index === 0 && (votes as number) > 0;

//                     return (
//                       <tr key={option} className={`${isWinner ? "bg-yellow-50" : "hover:bg-purple-50"} transition-colors`}>
//                         <td className="px-6 py-5 whitespace-nowrap">
//                           <span
//                             className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
//                               isWinner
//                                 ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800"
//                                 : "bg-purple-100 text-purple-800"
//                             }`}
//                           >
//                             #{index + 1}
//                           </span>
//                         </td>
//                         <td className="px-6 py-5">
//                           <div className="text-sm font-semibold text-gray-900">
//                             {option}
//                           </div>
//                         </td>
//                         <td className="px-6 py-5 whitespace-nowrap">
//                           <div className="text-lg font-bold text-purple-700">
//                             {votes as number}
//                           </div>
//                         </td>
//                         <td className="px-6 py-5 whitespace-nowrap">
//                           <div className="text-lg font-bold text-purple-700">
//                             {percentage}%
//                           </div>
//                         </td>
//                         <td className="px-6 py-5 whitespace-nowrap">
//                           <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
//                             <div
//                               className={`h-3 rounded-full bg-gradient-to-r ${
//                                 isWinner ? "from-yellow-400 to-amber-500" : "from-purple-400 to-purple-600"
//                               }`}
//                               style={{ width: `${percentage}%` }}
//                             ></div>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>

//         {/* Summary Stats */}
//         <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
//           <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
//             <div className="flex items-center">
//               <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mr-4">
//                 <FaUsers className="w-7 h-7 text-white" />
//               </div>
//               <div>
//                 <div className="text-3xl font-bold text-gray-900">
//                   {results.totalVotes}
//                 </div>
//                 <div className="text-sm text-gray-500 font-medium">Total Votes</div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
//             <div className="flex items-center">
//               <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mr-4">
//                 <FaChartPie className="w-7 h-7 text-white" />
//               </div>
//               <div>
//                 <div className="text-3xl font-bold text-gray-900">
//                   {results.options.length}
//                 </div>
//                 <div className="text-sm text-gray-500 font-medium">Options Available</div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
//             <div className="flex items-center">
//               <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mr-4">
//                 <FiTrendingUp className="w-7 h-7 text-white" />
//               </div>
//               <div>
//                 <div className="text-3xl font-bold text-gray-900">
//                   {topChoice ? topChoice.percentage : 0}%
//                 </div>
//                 <div className="text-sm text-gray-500 font-medium">Leading Option</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PollResults;

import React, { useState, useCallback } from "react";
import { 
  FaChartPie, 
  FaChartBar,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
import { FiFileText, FiTrendingUp } from "react-icons/fi";
import { useGetPollResults, useLivePollResults } from "@vidbloq/react";

interface PollResultsProps {
  agendaId: string;
  isLive?: boolean;
  onRefresh?: () => void;
}

const PollResults: React.FC<PollResultsProps> = ({ 
  agendaId,
  isLive = false,
  onRefresh
}) => {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  
  // Use static hook for initial data
  const { 
    getPollResults, 
    results: staticResults, 
    isLoading: staticLoading, 
    error: staticError,
    refresh 
  } = useGetPollResults();
  
  // Use live hook for real-time updates when needed
  const { 
    results: liveResults, 
    isLoading: liveLoading,
    error: liveError,
    pause,
    resume,
    refetch
  } = useLivePollResults(agendaId, {
    enabled: isLive,
    interval: 5000,
    onUpdate: (data) => {
      console.log('Poll results updated:', data);
      onRefresh?.();
    }
  });
  
  // Use live results if available, otherwise static
  const results = isLive ? liveResults : staticResults;
  const isLoading = isLive ? liveLoading : staticLoading;
  const error = isLive ? liveError : staticError;
  
  // Fetch initial data for static mode
  React.useEffect(() => {
    if (!isLive && agendaId) {
      getPollResults(agendaId);
    }
  }, [agendaId, isLive, getPollResults]);
  
  // Handle visibility change for live polling
  React.useEffect(() => {
    if (!isLive) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLive, pause, resume]);

  const handleRefresh = useCallback(async () => {
    if (isLive) {
      await refetch();
    } else {
      await refresh(agendaId);
    }
    onRefresh?.();
  }, [isLive, refetch, refresh, agendaId, onRefresh]);

  const calculatePercentage = (votes: number, total: number): number => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const getTopChoice = useCallback((): { option: string; votes: number; percentage: number } | null => {
    if (!results) return null;
    
    let topOption = '';
    let maxVotes = 0;
    
    Object.entries(results.voteCounts).forEach(([option, votes]) => {
      if ((votes as number) > maxVotes) {
        maxVotes = votes as number;
        topOption = option;
      }
    });
    
    return {
      option: topOption,
      votes: maxVotes,
      percentage: calculatePercentage(maxVotes, results.totalVotes)
    };
  }, [results]);

  const getColorForOption = (index: number): string => {
    const colors = [
      "from-purple-400 to-purple-600",
      "from-blue-400 to-blue-600",
      "from-green-400 to-green-600",
      "from-yellow-400 to-yellow-600",
      "from-pink-400 to-pink-600",
      "from-indigo-400 to-indigo-600"
    ];
    return colors[index % colors.length];
  };

  const downloadPollResults = useCallback((): void => {
    if (!results) return;

    const csvHeader = ['Option', 'Votes', 'Percentage'].join(',');
    const csvData = Object.entries(results.voteCounts).map(([option, votes]) => [
      `"${option}"`,
      votes,
      `${calculatePercentage(votes as number, results.totalVotes)}%`
    ].join(','));

    const csvContent = [
      `Poll: ${results.title || 'Untitled Poll'}`,
      `Total Votes: ${results.totalVotes}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      csvHeader,
      ...csvData
    ].join('\n');

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${(results.title || "Poll").replace(/\s+/g, "_")}_Results_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [results]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-purple-200 rounded-lg mb-4"></div>
            <div className="h-32 bg-purple-100 rounded-xl mb-6"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-purple-50 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isRateLimited = error.message?.includes('Rate limit exceeded');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 bg-white rounded-3xl shadow-xl border border-purple-100">
            <FaChartBar className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              {isRateLimited ? "Please wait a moment" : "Unable to Load Results"}
            </h2>
            <p className="text-gray-500 mb-4">
              {isRateLimited 
                ? "You've made too many requests. The data will refresh automatically."
                : error.message}
            </p>
            {!isRateLimited && (
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 bg-white rounded-3xl shadow-xl border border-purple-100">
            <FaChartBar className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              No Poll Results Yet
            </h2>
            <p className="text-gray-500">
              Results will appear once votes are submitted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const topChoice = getTopChoice();
  const sortedOptions = Object.entries(results.voteCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent mb-3">
                {results.title || "Poll Results"}
              </h1>
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FaUsers className="w-4 h-4 text-purple-500" />
                  <span>
                    <span className="font-semibold text-purple-700">{results.totalVotes}</span> total votes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaChartPie className="w-4 h-4 text-purple-500" />
                  <span>
                    <span className="font-semibold text-purple-700">{results.options.length}</span> options
                  </span>
                </div>
                {isLive && (
                  <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse">
                    <span>● LIVE</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-row gap-2 sm:gap-3 mt-4 lg:mt-0">
              <button
                onClick={downloadPollResults}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs sm:text-sm"
              >
                <MdOutlineFileDownload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Download</span> CSV
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-lg sm:rounded-xl hover:bg-purple-50 hover:-translate-y-0.5 transition-all duration-200 font-medium text-xs sm:text-sm"
              >
                <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Winner Highlight */}
        {topChoice && results.totalVotes > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8 shadow-lg relative overflow-hidden">
            <div className="absolute -top-2 -right-2 w-16 h-16 bg-yellow-400 rounded-full opacity-30 animate-pulse"></div>
            <div className="flex items-center relative">
              <FaTrophy className="w-10 h-10 text-yellow-600 mr-4" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-yellow-900 mb-1">
                  Leading Option
                </h2>
                <p className="text-yellow-800 text-lg font-medium mb-2">{topChoice.option}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-yellow-900 text-lg">
                    {topChoice.votes} votes ({topChoice.percentage}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="mb-6">
          <div className="border-b border-purple-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setViewMode("chart")}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  viewMode === "chart"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FaChartBar className="w-4 h-4" />
                Chart View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  viewMode === "table"
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FiFileText className="w-4 h-4" />
                Table View
              </button>
            </nav>
          </div>
        </div>

        {/* Results Display */}
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
          {viewMode === "chart" ? (
            <div className="p-8">
              <h2 className="text-xl font-bold text-purple-800 mb-6">
                Vote Distribution
              </h2>
              <div className="space-y-6">
                {sortedOptions.map(([option, votes], index) => {
                  const percentage = calculatePercentage(votes as number, results.totalVotes);
                  const isWinner = index === 0 && (votes as number) > 0;

                  return (
                    <div key={option} className="space-y-3 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span
                            className={`text-sm font-bold px-3 py-1 rounded-lg ${
                              isWinner
                                ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <h3 className="font-semibold text-gray-900 text-lg">{option}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-700">
                            {votes as number}
                          </div>
                          <div className="text-sm text-gray-500 font-medium">{percentage}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-4 rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${
                            isWinner
                              ? "from-yellow-400 to-amber-500 shadow-yellow-300"
                              : getColorForOption(index)
                          } shadow-sm`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-200">
                <thead className="bg-gradient-to-r from-purple-50 to-purple-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                      Option
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                      Votes
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                      Visual
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {sortedOptions.map(([option, votes], index) => {
                    const percentage = calculatePercentage(votes as number, results.totalVotes);
                    const isWinner = index === 0 && (votes as number) > 0;

                    return (
                      <tr key={option} className={`${isWinner ? "bg-yellow-50" : "hover:bg-purple-50"} transition-colors`}>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              isWinner
                                ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-semibold text-gray-900">
                            {option}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-lg font-bold text-purple-700">
                            {votes as number}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-lg font-bold text-purple-700">
                            {percentage}%
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full bg-gradient-to-r ${
                                isWinner ? "from-yellow-400 to-amber-500" : "from-purple-400 to-purple-600"
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Update Indicator */}
        {isLive && (
          <div className="mt-4 text-center text-sm text-purple-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-refreshing every 5 seconds</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollResults;