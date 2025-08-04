import React, { useState, useEffect } from "react";
import { 
  FaChartPie, 
  FaChartBar,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
import { FiFileText, FiTrendingUp } from "react-icons/fi";
import { useGetPollResults } from "@vidbloq/react";

interface PollResultsProps {
  agendaId: string;
  onRefresh?: () => void;
}

const PollResults: React.FC<PollResultsProps> = ({ 
  agendaId,
  onRefresh
}) => {
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const { getPollResults, isLoading, results } = useGetPollResults();

  useEffect(() => {
    if (agendaId) {
      fetchPollResults();
    }
  }, [agendaId]);

  const fetchPollResults = async () => {
    try {
      await getPollResults(agendaId);
    } catch (error) {
      console.error("Error fetching poll results:", error);
    }
  };

  const calculatePercentage = (votes: number, total: number): number => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const getTopChoice = (): { option: string; votes: number; percentage: number } | null => {
    if (!results) return null;
    
    let topOption = '';
    let maxVotes = 0;
    
    Object.entries(results.voteCounts).forEach(([option, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        topOption = option;
      }
    });
    
    return {
      option: topOption,
      votes: maxVotes,
      percentage: calculatePercentage(maxVotes, results.totalVotes)
    };
  };

  const getColorForOption = (index: number): string => {
    const colors = [
      "from-blue-400 to-blue-500",
      "from-green-400 to-green-500",
      "from-yellow-400 to-yellow-500",
      "from-purple-400 to-purple-500",
      "from-pink-400 to-pink-500",
      "from-indigo-400 to-indigo-500"
    ];
    return colors[index % colors.length];
  };

  const downloadPollResults = (): void => {
    if (!results) return;

    const csvHeader = ['Option', 'Votes', 'Percentage'].join(',');
    const csvData = Object.entries(results.voteCounts).map(([option, votes]) => [
      `"${option}"`,
      votes,
      `${calculatePercentage(votes, results.totalVotes)}%`
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
  };

  const downloadDetailedReport = (): void => {
    if (!results) return;

    const topChoice = getTopChoice();
    const sortedResults = Object.entries(results.voteCounts)
      .sort(([,a], [,b]) => b - a);

    const reportContent = `
POLL RESULTS REPORT
==================
Poll: ${results.title || "Untitled Poll"}
Generated: ${new Date().toLocaleString()}
Total Votes: ${results.totalVotes}

WINNING OPTION
=============
${topChoice ? `${topChoice.option} (${topChoice.votes} votes, ${topChoice.percentage}%)` : 'No votes recorded'}

DETAILED RESULTS
===============
${sortedResults.map(([option, votes], index) => {
  const percentage = calculatePercentage(votes, results.totalVotes);
  const rank = index + 1;
  return `${rank}. ${option}
   Votes: ${votes} (${percentage}%)
   Progress: ${'█'.repeat(Math.floor(percentage / 5))}${' '.repeat(20 - Math.floor(percentage / 5))} ${percentage}%`;
}).join('\n\n')}

SUMMARY STATISTICS
=================
Average votes per option: ${Math.round(results.totalVotes / results.options.length)}
Most popular option: ${topChoice?.option || 'N/A'}
Total options: ${results.options.length}
    `.trim();

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${(results.title || "Poll").replace(/\s+/g, "_")}_Detailed_Report_${new Date().toISOString().split("T")[0]}.txt`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <FaChartBar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            No Poll Results Found
          </h2>
          <p className="text-gray-500">
            Unable to load poll results at this time.
          </p>
        </div>
      </div>
    );
  }

  const topChoice = getTopChoice();
  const sortedOptions = Object.entries(results.voteCounts)
    .sort(([,a], [,b]) => b - a);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {results.title || "Poll Results"}
            </h1>
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaUsers className="w-4 h-4" />
                <span>{results.totalVotes} total votes</span>
              </div>
              <div className="flex items-center gap-2">
                <FaChartPie className="w-4 h-4" />
                <span>{results.options.length} options</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadPollResults}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <MdOutlineFileDownload className="w-4 h-4" />
              Download CSV
            </button>
            <button
              onClick={downloadDetailedReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiFileText className="w-4 h-4" />
              Full Report
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiTrendingUp className="w-4 h-4" />
                Refresh
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Winner Highlight */}
      {topChoice && results.totalVotes > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <FaTrophy className="w-8 h-8 text-yellow-600 mr-4" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-yellow-900 mb-1">
                Winning Option
              </h2>
              <p className="text-yellow-800 mb-2">{topChoice.option}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium text-yellow-900">
                  {topChoice.votes} votes ({topChoice.percentage}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setViewMode("chart")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                viewMode === "chart"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaChartBar className="w-4 h-4" />
              Chart View
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                viewMode === "table"
                  ? "border-blue-500 text-blue-600"
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {viewMode === "chart" ? (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Vote Distribution
            </h2>
            <div className="space-y-6">
              {sortedOptions.map(([option, votes], index) => {
                const percentage = calculatePercentage(votes, results.totalVotes);
                const isWinner = index === 0 && votes > 0;

                return (
                  <div key={option} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-sm font-medium px-2 py-1 rounded ${
                            isWinner
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <h3 className="font-medium text-gray-900">{option}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {votes}
                        </div>
                        <div className="text-sm text-gray-500">{percentage}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 bg-gradient-to-r ${
                          isWinner
                            ? "from-yellow-400 to-yellow-500"
                            : getColorForOption(index)
                        }`}
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Option
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visual
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOptions.map(([option, votes], index) => {
                  const percentage = calculatePercentage(votes, results.totalVotes);
                  const isWinner = index === 0 && votes > 0;

                  return (
                    <tr key={option} className={isWinner ? "bg-yellow-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isWinner
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {option}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-semibold text-gray-900">
                          {votes}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-semibold text-gray-900">
                          {percentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              isWinner ? "bg-yellow-500" : "bg-blue-500"
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

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FaUsers className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {results.totalVotes}
              </div>
              <div className="text-sm text-gray-500">Total Votes</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FaChartPie className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {results.options.length}
              </div>
              <div className="text-sm text-gray-500">Options Available</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FiTrendingUp className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {topChoice ? topChoice.percentage : 0}%
              </div>
              <div className="text-sm text-gray-500">Leading Option</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollResults;