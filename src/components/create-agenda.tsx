// import { useState, useEffect } from "react";
// import { useCreateAgenda, useStreamContext, useRequirePublicKey, useGetStreamAgenda } from "@vidbloq/react"
// import { FaPlus, FaRegTrashCan, FaCheck } from "react-icons/fa6";
// import { FaEdit, FaCircle } from "react-icons/fa";
// import {
//   type AgendaItem,
//   AgendaAction,
//   type AgendaFormData,
//   type PollOption,
//   type QuizQuestionForm,
// } from "../types/agenda";
// import toast from "react-hot-toast";

// const CreateAgenda = () => {
//   const [selectedType, setSelectedType] = useState<AgendaAction | null>(null);
//   const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [validationError, setValidationError] = useState<string>("");
//   const [formData, setFormData] = useState<AgendaFormData>({
//     timeStamp: 0,
//     title: "",
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

//   const { createAgenda } = useCreateAgenda();
//   const { agendas, getStreamAgenda } = useGetStreamAgenda()

//   const {roomName} = useStreamContext()
//   console.log({agendas})
//   const { publicKey } = useRequirePublicKey();
//   const agendaTypes = [
//     { type: AgendaAction.Poll, label: "Poll", icon: "📊" },
//     { type: AgendaAction.Q_A, label: "Q&A", icon: "❓" },
//     { type: AgendaAction.Quiz, label: "Quiz", icon: "🧩" },
//     { type: AgendaAction.Custom, label: "Custom", icon: "✨" },
//   ];

//   useEffect(() => {
    
//   getStreamAgenda(roomName)
    
//   }, [roomName])
  
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
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
//       title: agenda.title?.toString() || "",
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
//     setFormData({ timeStamp: 0, duration: 5, title: "" });
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
//     // if (onAgendasSubmit && agendaItems.length > 0) {
//     //   onAgendasSubmit(agendaItems);
//     // }
//     console.log("Agendas submitted:", agendaItems);
//     if(!publicKey) {
//         toast.error("Please connect your wallet to create an agenda.");
//         return;
//     }
//     createAgenda({
//         streamId: roomName,
//         wallet: publicKey?.toString(),
//         agendas: agendaItems
//     })
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
//               setFormData({ timeStamp: 0, duration: 5, title: "" });
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
//               type="text"
//               value={formData.timeStamp}
//               onChange={(e) =>
//                 setFormData({
//                   ...formData,
//                   timeStamp: parseInt(e.target.value) || 0,
//                 })
//               }
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
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
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
//             />
//             <textarea
//               placeholder="Description (optional)"
//               value={formData.description || ""}
//               onChange={(e) =>
//                 setFormData({ ...formData, description: e.target.value })
//               }
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none resize-none"
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
//                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
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
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
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
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
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
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
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
//                                 className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
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
//                             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none"
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
//     <div>
//       <div className="bg-white relative rounded-lg w-[70%] max-h-[80%] p-3">
//         {/* <div
//           className="bg-white p-1.5 absolute -top-2.5 -right-1.5 rounded cursor-pointer"
//           onClick={closeFunc}
//         >
//           <IoIosClose className="text-black text-lg" />
//         </div> */}
//         <div className="w-[60%] mx-auto h-full overflow-auto">

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             <div>
//               <h2 className="text-xl font-semibold text-gray-700 mb-4">
//                 Select Agenda Type
//               </h2>
//               <div className="grid grid-cols-4 gap-4 bg-red-60 p-3">
//                 {agendaTypes.map((type) => (
//                   <button
//                     key={type.type}
//                     onClick={() => {
//                       setSelectedType(type.type);
//                       setEditingId(null);
//                       setValidationError("");
//                     }}
//                     className={`p-3 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 ${
//                       selectedType === type.type ? "ring-2 ring-purple-500" : ""
//                     }`}
//                   >
//                     <div className="text-3xl mb-2">{type.icon}</div>
//                     <div className="font-semibold text-gray-700">
//                       {type.label}
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Form */}
//             <div>{renderForm()}</div>
//           </div>

//           {/* Agenda Timeline */}
//           {agendaItems.length > 0 && (
//             <div className="mt-12">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-semibold text-gray-700">
//                   Stream Timeline
//                 </h2>
//                 <button
//                   onClick={handleSubmitAll}
//                   className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
//                 >
//                   Submit All Agendas
//                   <FaCheck size={20} />
//                 </button>
//               </div>
//               <div className="bg-white rounded-xl shadow-lg p-6">
//                 <div className="space-y-4">
//                   {agendaItems
//                     .sort((a, b) => a.timeStamp - b.timeStamp)
//                     .map((item) => (
//                       <div
//                         key={item.id}
//                         className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg group"
//                       >
//                         <div className="text-sm font-medium text-purple-600 min-w-[80px]">
//                           {item.timeStamp} min
//                         </div>
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2 mb-1">
//                             <span className="text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded">
//                               {item.action}
//                             </span>
//                           </div>
//                           <div className="font-medium text-gray-800">
//                             {item.title || `${item.action} Agenda`}
//                           </div>
//                           {item.description && (
//                             <div className="text-sm text-gray-600 mt-1">
//                               {item.description}
//                             </div>
//                           )}
//                           {item.action === AgendaAction.Poll &&
//                             "options" in item && (
//                               <div className="text-sm text-gray-600 mt-2">
//                                 {item.options.length} options
//                               </div>
//                             )}
//                           {item.action === AgendaAction.Quiz &&
//                             "questions" in item && (
//                               <div className="text-sm text-gray-600 mt-2">
//                                 {item.questions.length} question(s),{" "}
//                                 {item.questions.reduce(
//                                   (acc, q) => acc + q.points,
//                                   0
//                                 )}{" "}
//                                 total points
//                               </div>
//                             )}
//                         </div>
//                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                           <button
//                             onClick={() => handleEdit(item)}
//                             className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                             title="Edit"
//                           >
//                             <FaEdit size={18} />
//                           </button>
//                           <button
//                             onClick={() => handleDelete(item.id)}
//                             className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                             title="Delete"
//                           >
//                             <FaRegTrashCan size={18} />
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreateAgenda;

import { useState, useEffect } from "react";
import { useCreateAgenda, useStreamContext, useRequirePublicKey, useGetStreamAgenda } from "@vidbloq/react"
import { FaPlus, FaRegTrashCan, FaCheck, FaCircle, FaClock, FaList, FaBrain, FaComments } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import {
  type AgendaItem,
  AgendaAction,
  type AgendaFormData,
  type PollOption,
  type QuizQuestionForm,
} from "../types/agenda";
import toast from "react-hot-toast";

const CreateAgenda = () => {
  const [selectedType, setSelectedType] = useState<AgendaAction | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [formData, setFormData] = useState<AgendaFormData>({
    timeStamp: 0,
    title: "",
    duration: undefined, // Remove default value
  });
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" },
  ]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionForm[]>([
    {
      id: "1",
      questionText: "",
      isMultiChoice: true,
      points: 10,
      correctAnswer: "",
      answers: [
        { id: "1", text: "" },
        { id: "2", text: "" },
      ],
    },
  ]);

  const { createAgenda } = useCreateAgenda();
  const { agendas, getStreamAgenda } = useGetStreamAgenda()

  const {roomName} = useStreamContext()
  console.log({agendas})
  const { publicKey } = useRequirePublicKey();
  
  const agendaTypes = [
    { type: AgendaAction.Poll, label: "Poll", icon: FaList, color: "bg-blue-500", lightColor: "bg-blue-50", borderColor: "border-blue-200" },
    { type: AgendaAction.Q_A, label: "Q&A", icon: FaComments, color: "bg-green-500", lightColor: "bg-green-50", borderColor: "border-green-200" },
    { type: AgendaAction.Quiz, label: "Quiz", icon: FaBrain, color: "bg-purple-500", lightColor: "bg-purple-50", borderColor: "border-purple-200" },
    { type: AgendaAction.Custom, label: "Custom", icon: IoSparkles, color: "bg-pink-500", lightColor: "bg-pink-50", borderColor: "border-pink-200" },
  ];

  useEffect(() => {
    getStreamAgenda(roomName)
  }, [roomName])
  
  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, { id: Date.now().toString(), text: "" }]);
  };

  const handleRemovePollOption = (id: string) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((opt) => opt.id !== id));
    }
  };

  const handlePollOptionChange = (id: string, value: string) => {
    setPollOptions(
      pollOptions.map((opt) => (opt.id === id ? { ...opt, text: value } : opt))
    );
  };

  const handleAddQuizQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        id: Date.now().toString(),
        questionText: "",
        isMultiChoice: true,
        points: 10,
        correctAnswer: "",
        answers: [
          { id: Date.now().toString() + "1", text: "" },
          { id: Date.now().toString() + "2", text: "" },
        ],
      },
    ]);
  };

  const handleRemoveQuizQuestion = (id: string) => {
    if (quizQuestions.length > 1) {
      setQuizQuestions(quizQuestions.filter((q) => q.id !== id));
    }
  };

  const handleQuizQuestionChange = (
    id: string,
    field: keyof QuizQuestionForm,
    value: any
  ) => {
    setQuizQuestions(
      quizQuestions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleQuizTypeChange = (questionId: string, isMultiChoice: boolean) => {
    setQuizQuestions(
      quizQuestions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            isMultiChoice,
            correctAnswer: "",
            answers: isMultiChoice
              ? [
                  { id: Date.now().toString() + "1", text: "" },
                  { id: Date.now().toString() + "2", text: "" },
                ]
              : [],
          };
        }
        return q;
      })
    );
  };

  const handleAddQuizAnswer = (questionId: string) => {
    setQuizQuestions(
      quizQuestions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: [...q.answers, { id: Date.now().toString(), text: "" }],
          };
        }
        return q;
      })
    );
  };

  const handleRemoveQuizAnswer = (questionId: string, answerId: string) => {
    setQuizQuestions(
      quizQuestions.map((q) => {
        if (q.id === questionId && q.answers.length > 2) {
          return {
            ...q,
            answers: q.answers.filter((a) => a.id !== answerId),
          };
        }
        return q;
      })
    );
  };

  const handleQuizAnswerChange = (
    questionId: string,
    answerId: string,
    value: string
  ) => {
    setQuizQuestions(
      quizQuestions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            answers: q.answers.map((a) =>
              a.id === answerId ? { ...a, text: value } : a
            ),
          };
        }
        return q;
      })
    );
  };

  const validateForm = (): boolean => {
    setValidationError("");

    if (!selectedType) return false;

    // Common validation
    if (
      (selectedType === AgendaAction.Poll ||
        selectedType === AgendaAction.Q_A ||
        selectedType === AgendaAction.Quiz ||
        selectedType === AgendaAction.Custom) &&
      !formData.title?.trim()
    ) {
      setValidationError(`Title is required for ${selectedType} agenda`);
      return false;
    }

    // Type-specific validation
    switch (selectedType) {
      case AgendaAction.Poll: {
        const validOptions = pollOptions.filter((opt) => opt.text.trim());
        if (validOptions.length < 2) {
          setValidationError("Poll requires at least 2 non-empty options");
          return false;
        }
        break;
      }

      case AgendaAction.Quiz: {
        if (quizQuestions.length === 0) {
          setValidationError("Quiz requires at least 1 question");
          return false;
        }

        for (let i = 0; i < quizQuestions.length; i++) {
          const question = quizQuestions[i];
          if (!question.questionText.trim()) {
            setValidationError(`Question ${i + 1}: Question text is required`);
            return false;
          }

          if (question.isMultiChoice) {
            const validAnswers = question.answers.filter((a) => a.text.trim());
            if (validAnswers.length < 2) {
              setValidationError(
                `Question ${
                  i + 1
                }: Multiple choice requires at least 2 non-empty options`
              );
              return false;
            }
            const correctAnswer = question.answers.find(
              (a) => a.id === question.correctAnswer
            );
            if (!correctAnswer || !correctAnswer.text.trim()) {
              setValidationError(
                `Question ${i + 1}: Please select a valid correct answer`
              );
              return false;
            }
          } else {
            if (!question.correctAnswer.trim()) {
              setValidationError(
                `Question ${i + 1}: Correct answer is required`
              );
              return false;
            }
          }
        }
        break;
      }

      case AgendaAction.Q_A: {
        // Topic is optional, will use title if not provided
        break;
      }

      case AgendaAction.Custom: {
        // Title is required, custom data is optional
        break;
      }
    }

    return true;
  };

  const handleEdit = (agenda: AgendaItem) => {
    setEditingId(agenda.id);
    setSelectedType(agenda.action);
    setFormData({
      timeStamp: agenda.timeStamp,
      title: agenda.title?.toString() || "",
      description: agenda.description,
      duration: agenda.duration,
    });

    switch (agenda.action) {
      case AgendaAction.Poll: {
        setPollOptions(
          agenda.options.map((opt, idx) => ({
            id: idx.toString(),
            text: opt,
          }))
        );
        break;
      }

      case AgendaAction.Quiz: {
        setQuizQuestions(
          agenda.questions.map((q, idx) => ({
            id: idx.toString(),
            questionText: q.questionText,
            isMultiChoice: q.isMultiChoice,
            points: q.points,
            correctAnswer: q.isMultiChoice
              ? q.options.findIndex((opt) => opt === q.correctAnswer).toString()
              : q.correctAnswer,
            answers: q.isMultiChoice
              ? q.options.map((opt, ansIdx) => ({
                  id: ansIdx.toString(),
                  text: opt,
                }))
              : [],
          }))
        );
        break;
      }

      case AgendaAction.Q_A: {
        setFormData((prev) => ({ ...prev, topic: agenda.topic }));
        break;
      }

      case AgendaAction.Custom: {
        setFormData((prev) => ({ ...prev, customData: agenda.customData }));
        break;
      }
    }
  };

  const handleDelete = (id: string) => {
    setAgendaItems(agendaItems.filter((item) => item.id !== id));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const baseAgenda = {
      id: editingId || Date.now().toString(),
      timeStamp: formData.timeStamp || 0,
      action: selectedType!,
      title: formData.title?.trim(),
      description: formData.description?.trim(),
      duration: formData.duration, // Keep as number, no default
    };

    let newAgenda: AgendaItem;

    switch (selectedType!) {
      case AgendaAction.Poll:
        newAgenda = {
          ...baseAgenda,
          action: AgendaAction.Poll,
          options: pollOptions
            .filter((opt) => opt.text.trim())
            .map((opt) => opt.text.trim()),
        };
        break;

      case AgendaAction.Quiz:
        newAgenda = {
          ...baseAgenda,
          action: AgendaAction.Quiz,
          questions: quizQuestions.map((q) => ({
            questionText: q.questionText.trim(),
            options: q.isMultiChoice
              ? q.answers.filter((a) => a.text.trim()).map((a) => a.text.trim())
              : [],
            correctAnswer: q.isMultiChoice
              ? q.answers.find((a) => a.id === q.correctAnswer)?.text.trim() ||
                ""
              : q.correctAnswer.trim(),
            isMultiChoice: q.isMultiChoice,
            points: q.points,
          })),
        };
        break;

      case AgendaAction.Q_A:
        newAgenda = {
          ...baseAgenda,
          action: AgendaAction.Q_A,
          topic: formData.topic?.trim() || formData.title?.trim(),
        };
        break;

      case AgendaAction.Custom:
        newAgenda = {
          ...baseAgenda,
          action: AgendaAction.Custom,
          customData: formData.customData || {},
        };
        break;

      default:
        return;
    }

    if (editingId) {
      setAgendaItems(
        agendaItems.map((item) => (item.id === editingId ? newAgenda : item))
      );
      setEditingId(null);
    } else {
      setAgendaItems([...agendaItems, newAgenda]);
    }

    // Reset form
    setSelectedType(null);
    setValidationError("");
    setFormData({ timeStamp: 0, title: "", duration: undefined });
    setPollOptions([
      { id: "1", text: "" },
      { id: "2", text: "" },
    ]);
    setQuizQuestions([
      {
        id: "1",
        questionText: "",
        isMultiChoice: true,
        points: 10,
        correctAnswer: "",
        answers: [
          { id: "1", text: "" },
          { id: "2", text: "" },
        ],
      },
    ]);
  };

  const handleSubmitAll = () => {
    console.log("Agendas submitted:", agendaItems);
    if(!publicKey) {
        toast.error("Please connect your wallet to create an agenda.");
        return;
    }
    
    // Convert duration to string for API compatibility
    const agendasForAPI = agendaItems.map(item => ({
      ...item,
      duration: item.duration?.toString() // Convert number to string
    }));
    
    createAgenda({
        streamId: roomName,
        wallet: publicKey?.toString(),
        agendas: agendasForAPI
    })
  };

  const selectedAgendaType = agendaTypes.find(type => type.type === selectedType);

  const renderForm = () => {
    if (!selectedType) return null;

    return (
      <div className={`bg-white rounded-2xl shadow-lg border-2 ${selectedAgendaType?.borderColor} p-8 animate-fadeIn`}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            {selectedAgendaType && <selectedAgendaType.icon className={`text-2xl ${selectedAgendaType.color.replace('bg-', 'text-')}`} />}
            <h2 className="text-2xl font-bold text-gray-800">
              {editingId ? "Edit" : "Create"} {selectedAgendaType?.label} Agenda
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedType(null);
              setEditingId(null);
              setValidationError("");
              setFormData({ timeStamp: 0, title: "", duration: undefined });
              setPollOptions([
                { id: "1", text: "" },
                { id: "2", text: "" },
              ]);
              setQuizQuestions([
                {
                  id: "1",
                  questionText: "",
                  isMultiChoice: true,
                  points: 10,
                  correctAnswer: "",
                  answers: [
                    { id: "1", text: "" },
                    { id: "2", text: "" },
                  ],
                },
              ]);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <FaRegTrashCan size={20} />
          </button>
        </div>

        {validationError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-shake">
            <FaCircle size={8} />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* General Section */}
          <div className={`p-6 rounded-xl ${selectedAgendaType?.lightColor}`}>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">General Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaClock className="inline mr-1" size={14} />
                  Start Time (minutes)
                </label>
                <input
                  type="text"
                  value={formData.timeStamp}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*$/.test(value)) {
                      setFormData({
                        ...formData,
                        timeStamp: value === '' ? 0 : parseInt(value) || 0,
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="text"
                  value={formData.duration || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setFormData({
                        ...formData,
                        duration: undefined,
                      });
                    } else if (/^\d*$/.test(value)) {
                      setFormData({
                        ...formData,
                        duration: parseInt(value) || undefined,
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter a compelling title..."
                  value={formData.title || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Add more context (optional)..."
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Poll Form */}
          {selectedType === AgendaAction.Poll && (
            <div className="p-6 bg-blue-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Poll Options</h3>
              <div className="space-y-3">
                {pollOptions.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option.text}
                      onChange={(e) =>
                        handlePollOptionChange(option.id, e.target.value)
                      }
                      className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => handleRemovePollOption(option.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FaRegTrashCan size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddPollOption}
                  className="mt-3 w-full py-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <FaPlus size={16} />
                  Add Option
                </button>
              </div>
            </div>
          )}

          {/* Q&A Form */}
          {selectedType === AgendaAction.Q_A && (
            <div className="p-6 bg-green-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Q&A Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discussion Topic
                </label>
                <input
                  type="text"
                  placeholder="Enter topic (optional - will use title if empty)"
                  value={formData.topic || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                />
                <p className="mt-2 text-sm text-gray-600">
                  This will open a Q&A session where participants can ask questions and engage in discussion.
                </p>
              </div>
            </div>
          )}

          {/* Quiz Form */}
          {selectedType === AgendaAction.Quiz && (
            <div className="space-y-6">
              {quizQuestions.map((question, qIndex) => (
                <div
                  key={question.id}
                  className="p-6 bg-purple-50 rounded-xl border-2 border-purple-200"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-lg text-gray-800">
                      Question {qIndex + 1}
                    </h4>
                    {quizQuestions.length > 1 && (
                      <button
                        onClick={() => handleRemoveQuizQuestion(question.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FaRegTrashCan size={18} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter your question..."
                      value={question.questionText}
                      onChange={(e) =>
                        handleQuizQuestionChange(
                          question.id,
                          "questionText",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors font-medium"
                    />

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Question Type
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                              type="radio"
                              checked={!question.isMultiChoice}
                              onChange={() =>
                                handleQuizTypeChange(question.id, false)
                              }
                              className="w-4 h-4 text-purple-600"
                            />
                            <span className="font-medium">Text Answer</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                              type="radio"
                              checked={question.isMultiChoice}
                              onChange={() =>
                                handleQuizTypeChange(question.id, true)
                              }
                              className="w-4 h-4 text-purple-600"
                            />
                            <span className="font-medium">Multiple Choice</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Points Value
                        </label>
                        <input
                          type="text"
                          value={question.points}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*$/.test(value)) {
                              handleQuizQuestionChange(
                                question.id,
                                "points",
                                value === '' ? 10 : parseInt(value) || undefined
                              );
                            }
                          }}
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                          placeholder="10"
                        />
                      </div>
                    </div>

                    {question.isMultiChoice ? (
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-3">
                          Answer Options (select the correct one)
                        </div>
                        <div className="space-y-3">
                          {question.answers.map((answer, aIndex) => (
                            <div
                              key={answer.id}
                              className="flex items-center gap-3 group"
                            >
                              <input
                                type="radio"
                                name={`correctAnswer-${question.id}`}
                                checked={question.correctAnswer === answer.id}
                                onChange={() =>
                                  handleQuizQuestionChange(
                                    question.id,
                                    "correctAnswer",
                                    answer.id
                                  )
                                }
                                className="w-5 h-5 text-purple-600"
                              />
                              <input
                                type="text"
                                placeholder={`Answer option ${aIndex + 1}`}
                                value={answer.text}
                                onChange={(e) =>
                                  handleQuizAnswerChange(
                                    question.id,
                                    answer.id,
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                              />
                              {question.answers.length > 2 && (
                                <button
                                  onClick={() =>
                                    handleRemoveQuizAnswer(
                                      question.id,
                                      answer.id
                                    )
                                  }
                                  className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <FaRegTrashCan size={18} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => handleAddQuizAnswer(question.id)}
                            className="mt-3 w-full py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-medium"
                          >
                            <FaPlus size={16} />
                            Add Answer Option
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Correct Answer
                        </label>
                        <input
                          type="text"
                          placeholder="Enter the correct answer..."
                          value={question.correctAnswer}
                          onChange={(e) =>
                            handleQuizQuestionChange(
                              question.id,
                              "correctAnswer",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddQuizQuestion}
                className="w-full py-4 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-medium text-lg"
              >
                <FaPlus size={18} />
                Add Another Question
              </button>
            </div>
          )}

          {/* Custom Form */}
          {selectedType === AgendaAction.Custom && (
            <div className="p-6 bg-pink-50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Custom Agenda</h3>
              <div className="text-sm text-gray-600 bg-white p-4 rounded-lg border border-pink-200">
                <p className="mb-2">✨ Create a custom agenda item with your own content.</p>
                <p>Use the title and description fields above to define your custom agenda.</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className={`w-full py-4 ${selectedAgendaType?.color} text-white rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 text-lg shadow-lg`}
          >
            {editingId ? "Update Agenda" : "Add to Timeline"}
            <FaCheck size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Stream Agenda</h1>
          <p className="text-gray-600">Design interactive experiences for your audience</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agenda Type Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-0">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Choose Agenda Type
              </h2>
              <div className="space-y-3">
                {agendaTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.type}
                      onClick={() => {
                        setSelectedType(type.type);
                        setEditingId(null);
                        setValidationError("");
                      }}
                      className={`w-full p-4 rounded-xl transition-all transform hover:scale-[1.02] ${
                        selectedType === type.type
                          ? `${type.color} text-white shadow-lg`
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={24} />
                        <span className="font-semibold text-lg">{type.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {!selectedType && (
                <div className="mt-6 p-4 bg-purple-50 rounded-xl text-sm text-purple-700">
                  <p className="font-medium mb-1">💡 Pro tip:</p>
                  <p>Mix different agenda types to keep your audience engaged throughout the stream!</p>
                </div>
              )}
            </div>
          </div>

          {/* Form Area */}
          <div className="lg:col-span-2">
            {selectedType ? (
              renderForm()
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <IoSparkles className="text-6xl text-purple-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                    Ready to create something amazing?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Select an agenda type from the left to start building interactive experiences for your stream.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <FaList className="text-blue-500 mb-2" size={20} />
                      <p className="font-medium text-gray-700">Polls</p>
                      <p className="text-gray-600">Get instant feedback</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <FaComments className="text-green-500 mb-2" size={20} />
                      <p className="font-medium text-gray-700">Q&A</p>
                      <p className="text-gray-600">Engage in discussion</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <FaBrain className="text-purple-500 mb-2" size={20} />
                      <p className="font-medium text-gray-700">Quiz</p>
                      <p className="text-gray-600">Test knowledge</p>
                    </div>
                    <div className="p-4 bg-pink-50 rounded-lg">
                      <IoSparkles className="text-pink-500 mb-2" size={20} />
                      <p className="font-medium text-gray-700">Custom</p>
                      <p className="text-gray-600">Your creativity</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Preview */}
        {agendaItems.length > 0 && (
          <div className="mt-12">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Timeline Preview</h2>
                  <p className="text-gray-600 mt-1">{agendaItems.length} agenda item{agendaItems.length !== 1 ? 's' : ''} created</p>
                </div>
                <button
                  onClick={handleSubmitAll}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-[1.02] flex items-center gap-3 shadow-lg"
                >
                  <FaCheck size={18} />
                  Publish All Agendas
                </button>
              </div>
              
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-purple-300 to-purple-200"></div>
                
                <div className="space-y-6">
                  {agendaItems
                    .sort((a, b) => a.timeStamp - b.timeStamp)
                    .map((item, index) => {
                      const agendaType = agendaTypes.find(t => t.type === item.action);
                      const Icon = agendaType?.icon || IoSparkles;
                      
                      return (
                        <div
                          key={item.id}
                          className="relative flex items-start gap-6 group"
                        >
                          {/* Timeline dot */}
                          <div className={`relative z-10 w-16 h-16 ${agendaType?.color} rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform group-hover:scale-110`}>
                            <Icon size={24} />
                          </div>
                          
                          {/* Content card */}
                          <div className={`flex-1 p-6 bg-white rounded-xl border-2 ${agendaType?.borderColor} hover:shadow-lg transition-all`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`text-xs font-bold px-3 py-1 ${agendaType?.color} text-white rounded-full`}>
                                    {item.action}
                                  </span>
                                  <span className="text-sm font-medium text-purple-600">
                                    <FaClock className="inline mr-1" size={12} />
                                    {item.timeStamp} min
                                  </span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 mb-1">
                                  {item.title || `${item.action} Agenda`}
                                </h3>
                                {item.description && (
                                  <p className="text-gray-600 text-sm mb-3">
                                    {item.description}
                                  </p>
                                )}
                                
                                {/* Type-specific info */}
                                <div className="text-sm text-gray-500">
                                  {item.action === AgendaAction.Poll && "options" in item && (
                                    <span>{item.options.length} poll options</span>
                                  )}
                                  {item.action === AgendaAction.Quiz && "questions" in item && (
                                    <span>
                                      {item.questions.length} question{item.questions.length !== 1 ? 's' : ''} • {" "}
                                      {item.questions.reduce((acc, q) => acc + q.points, 0)} total points
                                    </span>
                                  )}
                                  {item.action === AgendaAction.Q_A && "topic" in item && (
                                    <span>Topic: {item.topic}</span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <FaEdit size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <FaRegTrashCan size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              
              {/* Helper text */}
              <div className="mt-8 text-center text-sm text-gray-500">
                <p>📌 Agendas will be triggered at their scheduled times during the stream</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default CreateAgenda;