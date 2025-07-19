import React, { useState, useEffect, type JSX } from "react";
import { IoTrophyOutline, IoTrendingUpOutline } from "react-icons/io5";
import { FaAward, FaMedal, FaUser } from "react-icons/fa";
import { VscTarget } from "react-icons/vsc";
import { MdOutlineFileDownload } from "react-icons/md";
import { FiFileText } from "react-icons/fi";
import { useGetQuizResults } from "@vidbloq/react";

// Types based on your hook interfaces
interface QuestionStat {
  id: string;
  questionText: string;
  totalResponses: number;
  correctResponses: number;
  correctPercentage: number;
}

interface LeaderboardEntry {
  participantId: string;
  userName: string;
  walletAddress: string;
  pointsEarned: number;
  totalPoints: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
}


interface QuizLeaderboardProps {
  agendaId?: string;
}


const QuizLeaderboard: React.FC<QuizLeaderboardProps> = ({ agendaId }) => {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "stats">(
    "leaderboard"
  );

  // In a real implementation, you would use your hook like this:
  const { getQuizResults, isLoading, results } = useGetQuizResults();

  const fetchQuizResults = async () => {
    if (!agendaId) {
      console.log("No activeAgendaId, skipping fetch");
      return;
    }
    try {
      await getQuizResults(agendaId);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    }
  };

  useEffect(() => {
    if (agendaId) {
      fetchQuizResults();
    }
  }, [agendaId]);

  const getRankIcon = (position: number): JSX.Element => {
    switch (position) {
      case 1:
        return <IoTrophyOutline className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <FaMedal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <FaAward className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-600">
            #{position}
          </span>
        );
    }
  };

  const getRankStyle = (position: number): string => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
      case 3:
        return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
      default:
        return "bg-white border-gray-200 hover:bg-gray-50";
    }
  };

  const formatWalletAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const downloadLeaderboard = (): void => {
    if (!results) return;

    const csvHeader = [
      "Rank",
      "User Name",
      "Wallet Address",
      "Quiz Points",
      "Total Points",
      "Correct Answers",
      "Total Answers",
      "Accuracy (%)",
      "Quiz Completion Date",
    ].join(",");

    const csvData = results.leaderboard.map(
      (participant: LeaderboardEntry, index: number) =>
        [
          index + 1,
          `"${participant.userName}"`,
          participant.walletAddress,
          participant.pointsEarned,
          participant.totalPoints,
          participant.correctAnswers,
          participant.totalAnswers,
          participant.accuracy,
          new Date().toISOString().split("T")[0], // Current date as completion date
        ].join(",")
    );

    const csvContent = [csvHeader, ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${(results.title || "Quiz").replace(/\s+/g, "_")}_Leaderboard_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadDetailedReport = (): void => {
    if (!results) return;

    // Create a more comprehensive report
    const reportContent = `
QUIZ RESULTS REPORT
===================
Quiz: ${results.title || "Untitled Quiz"}
Generated: ${new Date().toLocaleString()}
Total Participants: ${results.totalParticipants}
Participants Who Answered: ${results.participantsAnswered}
Completion Rate: ${Math.round(
      (results.participantsAnswered / results.totalParticipants) * 100
    )}%

TOP 10 LEADERBOARD
==================
${results.leaderboard
  .slice(0, 10)
  .map(
    (participant: LeaderboardEntry, index: number) =>
      `${(index + 1).toString().padEnd(3)} ${participant.userName.padEnd(
        20
      )} ${participant.pointsEarned.toString().padEnd(6)} pts (${
        participant.accuracy
      }% accuracy)`
  )
  .join("\n")}

QUESTION STATISTICS
==================
${results.questionStats
  .map(
    (stat: QuestionStat, index: number) =>
      `Q${index + 1}: ${stat.correctPercentage}% success rate (${
        stat.correctResponses
      }/${stat.totalResponses} correct)
     ${stat.questionText}`
  )
  .join("\n\n")}

COMPLETE LEADERBOARD
===================
Rank | Name                 | Wallet Address        | Quiz Pts | Total Pts | Accuracy
-----|----------------------|-----------------------|----------|-----------|----------
${results.leaderboard
  .map(
    (participant: LeaderboardEntry, index: number) =>
      `${(index + 1).toString().padEnd(4)} | ${participant.userName.padEnd(
        20
      )} | ${participant.walletAddress.padEnd(21)} | ${participant.pointsEarned
        .toString()
        .padEnd(8)} | ${participant.totalPoints.toString().padEnd(9)} | ${
        participant.accuracy
      }%`
  )
  .join("\n")}
    `.trim();

    const blob = new Blob([reportContent], {
      type: "text/plain;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${(results.title || "Quiz").replace(/\s+/g, "_")}_Detailed_Report_${
        new Date().toISOString().split("T")[0]
      }.txt`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <IoTrophyOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            No Quiz Results Found
          </h2>
          <p className="text-gray-500">
            Unable to load quiz results at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {results.title || "Quiz Results"}
            </h1>
            <div className="flex flex-wrap gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaUser className="w-4 h-4" />
                <span>
                  {results.participantsAnswered} of {results.totalParticipants}{" "}
                  participated
                </span>
              </div>
              <div className="flex items-center gap-2">
                <VscTarget className="w-4 h-4" />
                <span>{results.questionStats.length} questions</span>
              </div>
            </div>
          </div>

          {/* Download Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadLeaderboard}
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
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "leaderboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "stats"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Question Statistics
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          {/* Top 3 Podium */}
          {results.leaderboard.length >= 3 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Top Performers
              </h2>
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                {/* Second Place */}
                <div className="text-center order-1">
                  <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg p-4 mb-3">
                    <FaMedal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-700">#2</div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {results.leaderboard[1].userName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.leaderboard[1].pointsEarned} pts
                  </div>
                  <div className="text-xs text-gray-500">
                    {results.leaderboard[1].accuracy}% accuracy
                  </div>
                </div>

                {/* First Place */}
                <div className="text-center order-2">
                  <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-lg p-4 mb-3 transform scale-110">
                    <IoTrophyOutline className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-700">#1</div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {results.leaderboard[0].userName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.leaderboard[0].pointsEarned} pts
                  </div>
                  <div className="text-xs text-gray-500">
                    {results.leaderboard[0].accuracy}% accuracy
                  </div>
                </div>

                {/* Third Place */}
                <div className="text-center order-3">
                  <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg p-4 mb-3">
                    <FaAward className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-amber-700">#3</div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {results.leaderboard[2].userName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {results.leaderboard[2].pointsEarned} pts
                  </div>
                  <div className="text-xs text-gray-500">
                    {results.leaderboard[2].accuracy}% accuracy
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Top 10 Rankings
              </h2>
              <div className="text-sm text-gray-600">
                Showing top 10 of {results.leaderboard.length} participants
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {results.leaderboard
                .slice(0, 10)
                .map((participant: LeaderboardEntry, index: number) => {
                  const position = index + 1;
                  return (
                    <div
                      key={participant.participantId}
                      className={`p-6 transition-colors ${getRankStyle(
                        position
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {getRankIcon(position)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                <FaUser className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-gray-900">
                                  {participant.userName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatWalletAddress(
                                    participant.walletAddress
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-right">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {participant.pointsEarned}
                            </p>
                            <p className="text-xs text-gray-500">Quiz Points</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-700">
                              {participant.correctAnswers}/
                              {participant.totalAnswers}
                            </p>
                            <p className="text-xs text-gray-500">Correct</p>
                          </div>
                          <div>
                            <p
                              className={`text-lg font-semibold ${
                                participant.accuracy >= 80
                                  ? "text-green-600"
                                  : participant.accuracy >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {participant.accuracy}%
                            </p>
                            <p className="text-xs text-gray-500">Accuracy</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              {participant.totalPoints}
                            </p>
                            <p className="text-xs text-gray-500">
                              Total Points
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Show More Info */}
            {results.leaderboard.length > 10 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {results.leaderboard.length - 10} more participants not
                    shown
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={downloadLeaderboard}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Download complete list →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Question Performance Analysis
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {results.questionStats.map((stat: QuestionStat, index: number) => (
              <div key={stat.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                      Question {index + 1}
                    </h3>
                    <p className="text-gray-700">{stat.questionText}</p>
                  </div>
                  <div className="ml-6 text-right">
                    <div
                      className={`text-2xl font-bold ${
                        stat.correctPercentage >= 80
                          ? "text-green-600"
                          : stat.correctPercentage >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {stat.correctPercentage}%
                    </div>
                    <div className="text-xs text-gray-500">Success Rate</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>
                    {stat.correctResponses} correct out of {stat.totalResponses}{" "}
                    responses
                  </span>
                  <IoTrendingUpOutline
                    className={`w-4 h-4 ${
                      stat.correctPercentage >= 60
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      stat.correctPercentage >= 80
                        ? "bg-green-500"
                        : stat.correctPercentage >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${stat.correctPercentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizLeaderboard;
