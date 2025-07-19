// import { useState } from "react";
// import { FaPlus, FaRegTrashCan, FaCheck } from "react-icons/fa6";
// import { FaEdit, FaCircle } from "react-icons/fa";
// import {
//   type AgendaItem,
//   AgendaAction,
//   type AgendaFormData,
//   type PollOption,
//   type QuizQuestionForm,
// } from "../types";

// interface StreamAgendaBuilderProps {
//   onAgendasSubmit?: (agendas: AgendaItem[]) => void;
// }

// const StreamAgendaBuilder: React.FC<StreamAgendaBuilderProps> = ({
//   onAgendasSubmit,
// }) => {
//   const [selectedType, setSelectedType] = useState<AgendaAction | null>(null);
//   const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [validationError, setValidationError] = useState<string>("");
//   const [formData, setFormData] = useState<AgendaFormData>({
//     timeStamp: 0,
//     duration: 5,
//   });
//   const [pollOptions, setPollOptions] = useState<PollOption[]>([
//     { id: "1", text: "" },
//     { id: "2", text: "" },
//   ]);
//   const [quizQuestions, setQuizQuestions] = useState<QuizQuestionForm[]>([
//     {
//       id: "1",
//       questionText: "",
//       isMultiChoice: true,
//       points: 10,
//       correctAnswer: "",
//       answers: [
//         { id: "1", text: "" },
//         { id: "2", text: "" },
//       ],
//     },
//   ]);

//   const agendaTypes = [
//     { type: AgendaAction.Poll, label: "Poll", icon: "📊" },
//     { type: AgendaAction.Q_A, label: "Q&A", icon: "❓" },
//     { type: AgendaAction.Quiz, label: "Quiz", icon: "🧩" },
//     { type: AgendaAction.Custom, label: "Custom", icon: "✨" },
//   ];

//   const handleAddPollOption = () => {
//     setPollOptions([...pollOptions, { id: Date.now().toString(), text: "" }]);
//   };

//   const handleRemovePollOption = (id: string) => {
//     if (pollOptions.length > 2) {
//       setPollOptions(pollOptions.filter((opt) => opt.id !== id));
//     }
//   };

//   const handlePollOptionChange = (id: string, value: string) => {
//     setPollOptions(
//       pollOptions.map((opt) => (opt.id === id ? { ...opt, text: value } : opt))
//     );
//   };

//   const handleAddQuizQuestion = () => {
//     setQuizQuestions([
//       ...quizQuestions,
//       {
//         id: Date.now().toString(),
//         questionText: "",
//         isMultiChoice: true,
//         points: 10,
//         correctAnswer: "",
//         answers: [
//           { id: Date.now().toString() + "1", text: "" },
//           { id: Date.now().toString() + "2", text: "" },
//         ],
//       },
//     ]);
//   };

//   const handleRemoveQuizQuestion = (id: string) => {
//     if (quizQuestions.length > 1) {
//       setQuizQuestions(quizQuestions.filter((q) => q.id !== id));
//     }
//   };

 
//   const handleQuizQuestionChange = (
//     id: string,
//     field: keyof QuizQuestionForm,
//      // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     value: any
//   ) => {
//     setQuizQuestions(
//       quizQuestions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
//     );
//   };

//   const handleQuizTypeChange = (questionId: string, isMultiChoice: boolean) => {
//     setQuizQuestions(
//       quizQuestions.map((q) => {
//         if (q.id === questionId) {
//           return {
//             ...q,
//             isMultiChoice,
//             correctAnswer: "",
//             answers: isMultiChoice
//               ? [
//                   { id: Date.now().toString() + "1", text: "" },
//                   { id: Date.now().toString() + "2", text: "" },
//                 ]
//               : [],
//           };
//         }
//         return q;
//       })
//     );
//   };

//   const handleAddQuizAnswer = (questionId: string) => {
//     setQuizQuestions(
//       quizQuestions.map((q) => {
//         if (q.id === questionId) {
//           return {
//             ...q,
//             answers: [...q.answers, { id: Date.now().toString(), text: "" }],
//           };
//         }
//         return q;
//       })
//     );
//   };

//   const handleRemoveQuizAnswer = (questionId: string, answerId: string) => {
//     setQuizQuestions(
//       quizQuestions.map((q) => {
//         if (q.id === questionId && q.answers.length > 2) {
//           return {
//             ...q,
//             answers: q.answers.filter((a) => a.id !== answerId),
//           };
//         }
//         return q;
//       })
//     );
//   };

//   const handleQuizAnswerChange = (
//     questionId: string,
//     answerId: string,
//     value: string
//   ) => {
//     setQuizQuestions(
//       quizQuestions.map((q) => {
//         if (q.id === questionId) {
//           return {
//             ...q,
//             answers: q.answers.map((a) =>
//               a.id === answerId ? { ...a, text: value } : a
//             ),
//           };
//         }
//         return q;
//       })
//     );
//   };

//   const validateForm = (): boolean => {
//     setValidationError("");

//     if (!selectedType) return false;

//     // Common validation
//     if (
//       (selectedType === AgendaAction.Poll ||
//         selectedType === AgendaAction.Q_A ||
//         selectedType === AgendaAction.Quiz ||
//         selectedType === AgendaAction.Custom) &&
//       !formData.title?.trim()
//     ) {
//       setValidationError(`Title is required for ${selectedType} agenda`);
//       return false;
//     }

//     // Type-specific validation
//     switch (selectedType) {
//       case AgendaAction.Poll: {
//         const validOptions = pollOptions.filter((opt) => opt.text.trim());
//         if (validOptions.length < 2) {
//           setValidationError("Poll requires at least 2 non-empty options");
//           return false;
//         }
//         break;
//       }

//       case AgendaAction.Quiz: {
//         if (quizQuestions.length === 0) {
//           setValidationError("Quiz requires at least 1 question");
//           return false;
//         }

//         for (let i = 0; i < quizQuestions.length; i++) {
//           const question = quizQuestions[i];
//           if (!question.questionText.trim()) {
//             setValidationError(`Question ${i + 1}: Question text is required`);
//             return false;
//           }

//           if (question.isMultiChoice) {
//             const validAnswers = question.answers.filter((a) => a.text.trim());
//             if (validAnswers.length < 2) {
//               setValidationError(
//                 `Question ${
//                   i + 1
//                 }: Multiple choice requires at least 2 non-empty options`
//               );
//               return false;
//             }
//             const correctAnswer = question.answers.find(
//               (a) => a.id === question.correctAnswer
//             );
//             if (!correctAnswer || !correctAnswer.text.trim()) {
//               setValidationError(
//                 `Question ${i + 1}: Please select a valid correct answer`
//               );
//               return false;
//             }
//           } else {
//             if (!question.correctAnswer.trim()) {
//               setValidationError(
//                 `Question ${i + 1}: Correct answer is required`
//               );
//               return false;
//             }
//           }
//         }
//         break;
//       }

//       case AgendaAction.Q_A: {
//         // Topic is optional, will use title if not provided
//         break;
//       }

//       case AgendaAction.Custom: {
//         // Title is required, custom data is optional
//         break;
//       }
//     }

//     return true;
//   };

//   const handleEdit = (agenda: AgendaItem) => {
//     setEditingId(agenda.id);
//     setSelectedType(agenda.action);
//     setFormData({
//       timeStamp: agenda.timeStamp,
//       title: agenda.title,
//       description: agenda.description,
//     });

//     switch (agenda.action) {
//       case AgendaAction.Poll: {
//         setPollOptions(
//           agenda.options.map((opt, idx) => ({
//             id: idx.toString(),
//             text: opt,
//           }))
//         );
//         break;
//       }

//       case AgendaAction.Quiz: {
//         setQuizQuestions(
//           agenda.questions.map((q, idx) => ({
//             id: idx.toString(),
//             questionText: q.questionText,
//             isMultiChoice: q.isMultiChoice,
//             points: q.points,
//             correctAnswer: q.isMultiChoice
//               ? q.options.findIndex((opt) => opt === q.correctAnswer).toString()
//               : q.correctAnswer,
//             answers: q.isMultiChoice
//               ? q.options.map((opt, ansIdx) => ({
//                   id: ansIdx.toString(),
//                   text: opt,
//                 }))
//               : [],
//           }))
//         );
//         break;
//       }

//       case AgendaAction.Q_A: {
//         setFormData((prev) => ({ ...prev, topic: agenda.topic }));
//         break;
//       }

//       case AgendaAction.Custom: {
//         setFormData((prev) => ({ ...prev, customData: agenda.customData }));
//         break;
//       }
//     }
//   };

//   const handleDelete = (id: string) => {
//     setAgendaItems(agendaItems.filter((item) => item.id !== id));
//   };

//   const handleSubmit = () => {
//     if (!validateForm()) return;

//     const baseAgenda = {
//       id: editingId || Date.now().toString(),
//       timeStamp: formData.timeStamp || 0,
//       action: selectedType!,
//       title: formData.title?.trim(),
//       description: formData.description?.trim(),
//     };

//     let newAgenda: AgendaItem;

//     switch (selectedType!) {
//       case AgendaAction.Poll:
//         newAgenda = {
//           ...baseAgenda,
//           action: AgendaAction.Poll,
//           options: pollOptions
//             .filter((opt) => opt.text.trim())
//             .map((opt) => opt.text.trim()),
//         };
//         break;

//       case AgendaAction.Quiz:
//         newAgenda = {
//           ...baseAgenda,
//           action: AgendaAction.Quiz,
//           questions: quizQuestions.map((q) => ({
//             questionText: q.questionText.trim(),
//             options: q.isMultiChoice
//               ? q.answers.filter((a) => a.text.trim()).map((a) => a.text.trim())
//               : [],
//             correctAnswer: q.isMultiChoice
//               ? q.answers.find((a) => a.id === q.correctAnswer)?.text.trim() ||
//                 ""
//               : q.correctAnswer.trim(),
//             isMultiChoice: q.isMultiChoice,
//             points: q.points,
//           })),
//         };
//         break;

//       case AgendaAction.Q_A:
//         newAgenda = {
//           ...baseAgenda,
//           action: AgendaAction.Q_A,
//           topic: formData.topic?.trim() || formData.title?.trim(),
//         };
//         break;

//       case AgendaAction.Custom:
//         newAgenda = {
//           ...baseAgenda,
//           action: AgendaAction.Custom,
//           customData: formData.customData || {},
//         };
//         break;

//       default:
//         return;
//     }

//     if (editingId) {
//       setAgendaItems(
//         agendaItems.map((item) => (item.id === editingId ? newAgenda : item))
//       );
//       setEditingId(null);
//     } else {
//       setAgendaItems([...agendaItems, newAgenda]);
//     }

//     // Reset form
//     setSelectedType(null);
//     setValidationError("");
//     setFormData({ timeStamp: 0, duration: 5 });
//     setPollOptions([
//       { id: "1", text: "" },
//       { id: "2", text: "" },
//     ]);
//     setQuizQuestions([
//       {
//         id: "1",
//         questionText: "",
//         isMultiChoice: true,
//         points: 10,
//         correctAnswer: "",
//         answers: [
//           { id: "1", text: "" },
//           { id: "2", text: "" },
//         ],
//       },
//     ]);
//   };

//   const handleSubmitAll = () => {
//     if (onAgendasSubmit && agendaItems.length > 0) {
//       onAgendasSubmit(agendaItems);
//     }
//   };

//   const renderForm = () => {
//     if (!selectedType) return null;

//     return (
//       <div className="bg-white rounded-2xl shadow-xl p-6 animate-fadeIn">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-xl font-semibold text-gray-800">
//             {editingId ? "Edit Agenda" : "Create Agendas"}
//           </h2>
//           <button
//             onClick={() => {
//               setSelectedType(null);
//               setEditingId(null);
//               setValidationError("");
//               setFormData({ timeStamp: 0, duration: 5 });
//               setPollOptions([
//                 { id: "1", text: "" },
//                 { id: "2", text: "" },
//               ]);
//               setQuizQuestions([
//                 {
//                   id: "1",
//                   questionText: "",
//                   isMultiChoice: true,
//                   points: 10,
//                   correctAnswer: "",
//                   answers: [
//                     { id: "1", text: "" },
//                     { id: "2", text: "" },
//                   ],
//                 },
//               ]);
//             }}
//             className="text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <FaRegTrashCan size={24} />
//           </button>
//         </div>

//         {validationError && (
//           <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
//             <FaCircle size={20} />
//             <span className="text-sm">{validationError}</span>
//           </div>
//         )}

//         <div className="space-y-4">
//           <div className="text-sm font-medium text-gray-600 mb-2">General</div>

//           {/* Timestamp */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Start Time (minutes)
//             </label>
//             <input
//               type="number"
//               min="0"
//               max="60"
//               value={formData.timeStamp}
//               onChange={(e) =>
//                 setFormData({
//                   ...formData,
//                   timeStamp: parseInt(e.target.value) || 0,
//                 })
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//               placeholder="0"
//             />
//           </div>

//           {/* Title and Description */}
//           <div className="space-y-4">
//             <input
//               type="text"
//               placeholder="Title (required for most agenda types)"
//               value={formData.title || ""}
//               onChange={(e) =>
//                 setFormData({ ...formData, title: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//             />
//             <textarea
//               placeholder="Description (optional)"
//               value={formData.description || ""}
//               onChange={(e) =>
//                 setFormData({ ...formData, description: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
//               rows={3}
//             />
//           </div>

//           {/* Poll Form */}
//           {selectedType === AgendaAction.Poll && (
//             <>
//               <div className="font-medium text-gray-800 mb-2">POLL</div>
//               <div className="mt-4">
//                 <div className="text-sm text-gray-600 mb-2">Options</div>
//                 {pollOptions.map((option, index) => (
//                   <div key={option.id} className="flex items-center gap-2 mb-2">
//                     <input
//                       type="text"
//                       placeholder={`Option ${index + 1}`}
//                       value={option.text}
//                       onChange={(e) =>
//                         handlePollOptionChange(option.id, e.target.value)
//                       }
//                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                     />
//                     {pollOptions.length > 2 && (
//                       <button
//                         onClick={() => handleRemovePollOption(option.id)}
//                         className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                       >
//                         <FaRegTrashCan size={20} />
//                       </button>
//                     )}
//                   </div>
//                 ))}
//                 <button
//                   onClick={handleAddPollOption}
//                   className="mt-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-500 transition-colors flex items-center justify-center gap-2"
//                 >
//                   <FaPlus size={20} />
//                   Add Option
//                 </button>
//               </div>
//             </>
//           )}

//           {/* Q&A Form */}
//           {selectedType === AgendaAction.Q_A && (
//             <>
//               <div className="font-medium text-gray-800 mb-2">
//                 Q&A <span className="text-gray-400">(discussion)</span>
//               </div>
//               <input
//                 type="text"
//                 placeholder="Enter Topic (optional - will use title if not provided)"
//                 value={formData.topic || ""}
//                 onChange={(e) =>
//                   setFormData({ ...formData, topic: e.target.value })
//                 }
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//               />
//             </>
//           )}

//           {/* Quiz Form */}
//           {selectedType === AgendaAction.Quiz && (
//             <>
//               <div className="font-medium text-gray-800 mb-2">Quiz</div>
//               <div className="space-y-6">
//                 {quizQuestions.map((question, qIndex) => (
//                   <div
//                     key={question.id}
//                     className="p-4 border border-gray-200 rounded-lg"
//                   >
//                     <div className="flex justify-between items-center mb-4">
//                       <h4 className="font-medium text-gray-700">
//                         Question {qIndex + 1}
//                       </h4>
//                       {quizQuestions.length > 1 && (
//                         <button
//                           onClick={() => handleRemoveQuizQuestion(question.id)}
//                           className="text-red-500 hover:text-red-700"
//                         >
//                           <FaRegTrashCan size={20} />
//                         </button>
//                       )}
//                     </div>

//                     <div className="space-y-4">
//                       <input
//                         type="text"
//                         placeholder="Enter Question"
//                         value={question.questionText}
//                         onChange={(e) =>
//                           handleQuizQuestionChange(
//                             question.id,
//                             "questionText",
//                             e.target.value
//                           )
//                         }
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                       />

//                       <div className="grid grid-cols-2 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Question Type
//                           </label>
//                           <div className="flex gap-4">
//                             <label className="flex items-center gap-2">
//                               <input
//                                 type="radio"
//                                 checked={!question.isMultiChoice}
//                                 onChange={() =>
//                                   handleQuizTypeChange(question.id, false)
//                                 }
//                                 className="w-4 h-4 text-purple-600"
//                               />
//                               <span className="text-sm">Normal</span>
//                             </label>
//                             <label className="flex items-center gap-2">
//                               <input
//                                 type="radio"
//                                 checked={question.isMultiChoice}
//                                 onChange={() =>
//                                   handleQuizTypeChange(question.id, true)
//                                 }
//                                 className="w-4 h-4 text-purple-600"
//                               />
//                               <span className="text-sm">Multiple Choice</span>
//                             </label>
//                           </div>
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Points
//                           </label>
//                           <input
//                             type="number"
//                             min="1"
//                             max="100"
//                             value={question.points}
//                             onChange={(e) =>
//                               handleQuizQuestionChange(
//                                 question.id,
//                                 "points",
//                                 parseInt(e.target.value) || 10
//                               )
//                             }
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                           />
//                         </div>
//                       </div>

//                       {question.isMultiChoice ? (
//                         <div>
//                           <div className="text-sm text-gray-600 mb-2">
//                             Answer Options (select correct answer)
//                           </div>
//                           {question.answers.map((answer, aIndex) => (
//                             <div
//                               key={answer.id}
//                               className="flex items-center gap-2 mb-2"
//                             >
//                               <input
//                                 type="radio"
//                                 name={`correctAnswer-${question.id}`}
//                                 checked={question.correctAnswer === answer.id}
//                                 onChange={() =>
//                                   handleQuizQuestionChange(
//                                     question.id,
//                                     "correctAnswer",
//                                     answer.id
//                                   )
//                                 }
//                                 className="w-4 h-4 text-purple-600"
//                               />
//                               <input
//                                 type="text"
//                                 placeholder={`Option ${aIndex + 1}`}
//                                 value={answer.text}
//                                 onChange={(e) =>
//                                   handleQuizAnswerChange(
//                                     question.id,
//                                     answer.id,
//                                     e.target.value
//                                   )
//                                 }
//                                 className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                               />
//                               {question.answers.length > 2 && (
//                                 <button
//                                   onClick={() =>
//                                     handleRemoveQuizAnswer(
//                                       question.id,
//                                       answer.id
//                                     )
//                                   }
//                                   className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                                 >
//                                   <FaRegTrashCan size={20} />
//                                 </button>
//                               )}
//                             </div>
//                           ))}
//                           <button
//                             onClick={() => handleAddQuizAnswer(question.id)}
//                             className="mt-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-500 transition-colors flex items-center justify-center gap-2"
//                           >
//                             <FaPlus size={20} />
//                             Add Option
//                           </button>
//                         </div>
//                       ) : (
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Correct Answer
//                           </label>
//                           <input
//                             type="text"
//                             placeholder="Enter the correct answer"
//                             value={question.correctAnswer}
//                             onChange={(e) =>
//                               handleQuizQuestionChange(
//                                 question.id,
//                                 "correctAnswer",
//                                 e.target.value
//                               )
//                             }
//                             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                           />
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}

//                 <button
//                   onClick={handleAddQuizQuestion}
//                   className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-500 hover:text-purple-500 transition-colors flex items-center justify-center gap-2"
//                 >
//                   <FaPlus size={20} />
//                   Add Another Question
//                 </button>
//               </div>
//             </>
//           )}

//           {/* Custom Form */}
//           {selectedType === AgendaAction.Custom && (
//             <>
//               <div className="font-medium text-gray-800 mb-2">Custom</div>
//               <div className="text-sm text-gray-600 mb-4">
//                 Title and description fields above will be used for custom
//                 content
//               </div>
//             </>
//           )}

//           {/* Submit Button */}
//           <button
//             onClick={handleSubmit}
//             className="w-full mt-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
//           >
//             {editingId ? "Update Agenda" : "Add to Timeline"}
//             <FaCheck size={20} />
//           </button>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
//       <div className="max-w-6xl mx-auto">
//         <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
//           Stream Agenda Builder
//         </h1>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Agenda Type Selector */}
//           <div>
//             <h2 className="text-xl font-semibold text-gray-700 mb-4">
//               Select Agenda Type
//             </h2>
//             <div className="grid grid-cols-2 gap-4">
//               {agendaTypes.map((type) => (
//                 <button
//                   key={type.type}
//                   onClick={() => {
//                     setSelectedType(type.type);
//                     setEditingId(null);
//                     setValidationError("");
//                   }}
//                   className={`p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 ${
//                     selectedType === type.type ? "ring-2 ring-purple-500" : ""
//                   }`}
//                 >
//                   <div className="text-3xl mb-2">{type.icon}</div>
//                   <div className="font-semibold text-gray-700">
//                     {type.label}
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Form */}
//           <div>{renderForm()}</div>
//         </div>

//         {/* Agenda Timeline */}
//         {agendaItems.length > 0 && (
//           <div className="mt-12">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold text-gray-700">
//                 Stream Timeline
//               </h2>
//               <button
//                 onClick={handleSubmitAll}
//                 className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
//               >
//                 Submit All Agendas
//                 <FaCheck size={20} />
//               </button>
//             </div>
//             <div className="bg-white rounded-xl shadow-lg p-6">
//               <div className="space-y-4">
//                 {agendaItems
//                   .sort((a, b) => a.timeStamp - b.timeStamp)
//                   .map((item) => (
//                     <div
//                       key={item.id}
//                       className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg group"
//                     >
//                       <div className="text-sm font-medium text-purple-600 min-w-[80px]">
//                         {item.timeStamp} min
//                       </div>
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2 mb-1">
//                           <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded">
//                             {item.action}
//                           </span>
//                         </div>
//                         <div className="font-medium text-gray-800">
//                           {item.title || `${item.action} Agenda`}
//                         </div>
//                         {item.description && (
//                           <div className="text-sm text-gray-600 mt-1">
//                             {item.description}
//                           </div>
//                         )}
//                         {item.action === AgendaAction.Poll &&
//                           "options" in item && (
//                             <div className="text-sm text-gray-600 mt-2">
//                               {item.options.length} options
//                             </div>
//                           )}
//                         {item.action === AgendaAction.Quiz &&
//                           "questions" in item && (
//                             <div className="text-sm text-gray-600 mt-2">
//                               {item.questions.length} question(s),{" "}
//                               {item.questions.reduce(
//                                 (acc, q) => acc + q.points,
//                                 0
//                               )}{" "}
//                               total points
//                             </div>
//                           )}
//                       </div>
//                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                         <button
//                           onClick={() => handleEdit(item)}
//                           className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                           title="Edit"
//                         >
//                           <FaEdit size={18} />
//                         </button>
//                         <button
//                           onClick={() => handleDelete(item.id)}
//                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                           title="Delete"
//                         >
//                           <FaRegTrashCan size={18} />
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default StreamAgendaBuilder;

import React, { useState } from 'react';

// Types
interface AgendaItem {
  id: string;
  title: string;
  description: string;
  duration: string;
}

interface AgendaProps {
  items?: AgendaItem[];
  currentPage?: number;
  totalPages?: number;
  onEdit?: (item: AgendaItem) => void;
  onDelete?: (itemId: string) => void;
  onAddAgenda?: () => void;
}

// Menu component for edit/delete options
const AgendaItemMenu: React.FC<{
  item: AgendaItem;
  onEdit?: (item: AgendaItem) => void;
  onDelete?: (itemId: string) => void;
}> = ({ item, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded"
        aria-label="Menu"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9Z"
            fill="currentColor"
          />
          <path
            d="M8 4C8.55228 4 9 3.55228 9 3C9 2.44772 8.55228 2 8 2C7.44772 2 7 2.44772 7 3C7 3.55228 7.44772 4 8 4Z"
            fill="currentColor"
          />
          <path
            d="M8 14C8.55228 14 9 13.5523 9 13C9 12.4477 8.55228 12 8 12C7.44772 12 7 12.4477 7 13C7 13.5523 7.44772 14 8 14Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu dropdown */}
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[120px]">
            <button
              onClick={() => {
                onEdit?.(item);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-500 flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => {
                onDelete?.(item.id);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6" />
                <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2" />
              </svg>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Main Agenda component
const Agenda: React.FC<AgendaProps> = ({
  items = [
    {
      id: '1',
      title: 'POLL',
      description: 'Members are expected to participate in a poll',
      duration: '12m'
    },
    {
      id: '2',
      title: 'Q&A',
      description: 'Questions and answers',
      duration: '15m'
    },
    {
      id: '3',
      title: 'GIVEAWAY',
      description: 'Opportunity to be gifted',
      duration: '10m'
    },
    {
      id: '4',
      title: 'NEXT STEPS',
      description: 'Opportunity to be gifted',
      duration: '20m'
    }
  ],
  currentPage = 1,
  totalPages = 4,
  onEdit,
  onDelete,
  onAddAgenda
}) => {
  return (
    <div className="bg-white rounded-lg h-full p-5 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-base">Agenda</h2>
        <span className="text-gray-400 text-sm">{currentPage}/{totalPages}</span>
      </div>

      <div className="relative">
        <div className="absolute top-0 bottom-0 left-1.5 border-l border-dashed border-gray-200 z-0"></div>

        <div className="space-y-8 relative z-10">
          {items.map((item) => (
            <div key={item.id} className="flex group">
              <div className="w-3 h-3 rounded-full bg-white border border-gray-300 flex-shrink-0 mt-1.5"></div>
              <div className="ml-5 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-gray-800 uppercase">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
                      {item.duration}
                    </div>
                    <AgendaItemMenu
                      item={item}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-xs text-gray-500 text-center">
        Hover on an "agenda" to remove or edit it.
      </div>

      <button
        onClick={onAddAgenda}
        className="w-full mt-4 bg-primary-light text-text-primary py-2 rounded-md text-sm"
      >
        Add Agenda
      </button>
    </div>
  );
};

export default Agenda;