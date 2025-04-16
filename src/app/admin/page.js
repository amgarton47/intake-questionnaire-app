"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [usersData, setUsersData] = useState([]);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "admin") {
      router.push("/login");
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    const { data: responses, error } = await supabase
      .from("questionnaire_results")
      .select("user_id, questionnaire_id, users(username)")
      .order("user_id");

    if (error) {
      console.log("Error fetching responses:", error);
      return;
    }

    const userQuestionnaireMap = {};

    responses.forEach((r) => {
      const key = r.user_id;
      if (!userQuestionnaireMap[key]) {
        userQuestionnaireMap[key] = {
          username: r.users?.username || "Unknown",
          user_id: r.user_id,
          questionnaires: new Set(),
        };
      }
      userQuestionnaireMap[key].questionnaires.add(r.questionnaire_id);
    });

    const result = Object.values(userQuestionnaireMap).map((user) => ({
      ...user,
      completedCount: user.questionnaires.size,
    }));

    setUsersData(result);
  };

  const openUserDetails = async (userId) => {
    const { data: results, error } = await supabase
      .from("questionnaire_results")
      .select(
        "answer_text, question_id, questionnaire_id, questions(question), questionnaires(name)"
      )
      .eq("user_id", userId);

    if (error) {
      console.log("Error fetching user details:", error);
      return;
    }

    // Group the results by questionnaire
    const groupedResults = results.reduce((acc, result) => {
      const questionnaireName =
        result.questionnaires?.name || "Unknown Questionnaire";
      if (!acc[questionnaireName]) {
        acc[questionnaireName] = [];
      }
      acc[questionnaireName].push({
        question: result.questions.question,
        answer_text: result.answer_text,
      });
      return acc;
    }, {});

    setSelectedUserDetails({
      userId,
      groupedResults,
    });

    setModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>

      <table className="min-w-full table-auto border border-gray-300 shadow">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3 border-b">Username</th>
            <th className="p-3 border-b">Questionnaires Completed</th>
            <th className="p-3 border-b">View Answers</th>
          </tr>
        </thead>
        <tbody>
          {usersData.map((user) => (
            <tr key={user.user_id} className="hover:bg-gray-50">
              <td className="p-3 border-b">{user.username}</td>
              <td className="p-3 border-b">{user.completedCount}</td>
              <td className="p-3 border-b">
                <button
                  onClick={() => openUserDetails(user.user_id, user.username)}
                  className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalOpen && selectedUserDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full space-y-4">
            <h2 className="text-xl font-bold mb-4">
              Answers from {selectedUserDetails.username}
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(selectedUserDetails.groupedResults).map(
                ([questionnaireName, qna], index) => (
                  <div key={index} className="mb-4">
                    <h3 className="text-xl font-semibold">
                      {questionnaireName} questionnaire
                    </h3>
                    {qna.map((item, idx) => (
                      <div key={idx}>
                        <p className="font-semibold">Q: {item.question}</p>
                        <p className="text-gray-700">
                          A: {item.answer_text || "(No answer)"}
                        </p>
                        <hr className="my-2" />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
            <div className="text-right">
              <button
                className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
