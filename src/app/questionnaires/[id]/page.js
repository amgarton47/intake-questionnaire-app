"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

export default function QuestionnairePage() {
  const { id } = useParams();
  const router = useRouter();

  const [questionnaireName, setQuestionnaireName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser) {
        router.push("/login");
        return;
      }
      setUser(storedUser);

      // Fetch the questionnaire to get its name
      const { data: questionnaire, error: questionnaireError } = await supabase
        .from("questionnaires")
        .select("name")
        .eq("id", id)
        .single();

      if (questionnaireError) {
        console.log("Error fetching questionnaire:", questionnaireError);
        setLoading(false);
        return;
      }

      setQuestionnaireName(questionnaire?.name || `Questionnaire ${id}`);

      // Get the list of question_ids for this questionnaire
      const { data: questionnaireQuestions, error: questionsError } =
        await supabase
          .from("questionnaire_questions")
          .select("question_id, priority")
          .eq("questionnaire_id", id)
          .order("priority", { ascending: true });

      if (questionsError) {
        console.log("Error fetching questionnaire questions:", questionsError);
        setLoading(false);
        return;
      }

      const questionIds = questionnaireQuestions.map((q) => q.question_id);

      // Fetch the actual questions (question text, options, and whether multiple answers are allowed)
      const { data: questionsData, error: questionsFetchError } = await supabase
        .from("questions")
        .select("id, question, type, options, allow_multiple_answers")
        .in("id", questionIds);

      if (questionsFetchError) {
        console.log("Error fetching questions:", questionsFetchError);
        setLoading(false);
        return;
      }

      setQuestions(questionsData);

      // Now fetch the user's responses to all questionnaires (if any)
      const { data: userResponses, error: responsesError } = await supabase
        .from("questionnaire_results")
        .select("question_id, answer_text")
        .eq("user_id", storedUser.id)
        .eq("questionnaire_id", id);
      // .order("create_date", { ascending: true });

      if (responsesError) {
        console.log("Error fetching responses:", responsesError);
        setLoading(false);
        return;
      }

      // Map the responses to the question IDs
      const userResponsesMap = userResponses.reduce(
        (acc, { question_id, answer_text }) => {
          acc[question_id] = answer_text;
          return acc;
        },
        {}
      );

      // Prepopulate the form responses
      const initialResponses = {};

      // Prepopulate answers from userResponsesMap
      questionsData.forEach((question) => {
        if (userResponsesMap[question.id]) {
          initialResponses[question.id] = userResponsesMap[question.id];
        }
      });

      setResponses(initialResponses);
      setLoading(false);
    }

    fetchData();
  }, [id, router]);

  function handleResponseChange(questionId, value) {
    setResponses((prevResponses) => ({
      ...prevResponses,
      [questionId]: value,
    }));
  }

  const handleMultipleChoiceChange = (questionId, value) => {
    setResponses((prevResponses) => {
      // Ensure current_answers is an array before operating on it
      const currentAnswers = Array.isArray(prevResponses[questionId])
        ? prevResponses[questionId]
        : [];

      if (currentAnswers.includes(value)) {
        return {
          ...prevResponses,
          [questionId]: currentAnswers.filter((answer) => answer !== value),
        };
      } else {
        return {
          ...prevResponses,
          [questionId]: [...currentAnswers, value],
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = Object.entries(responses).map(([questionId, response]) => ({
      user_id: user.id,
      questionnaire_id: id,
      question_id: questionId,
      answer_text: Array.isArray(response) ? response.join(", ") : response,
    }));

    const { error } = await supabase
      .from("questionnaire_results")
      .upsert(payload);

    if (error) {
      console.log("Error submitting responses:", error);
      alert("Something went wrong.");
    } else {
      alert("Responses submitted!");
      router.push("/thank-you");
    }
  };

  if (loading)
    return <div className="p-6 text-gray-500">Loading questionnaire...</div>;

  if (questions.length === 0)
    return <div>No questions found for this questionnaire.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-2">
        Questionnaire: {questionnaireName}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((question, idx) => (
          <div key={question.id} className="space-y-4">
            <span className="text-lg font-semibold text-gray-700">
              {idx + 1}. {question.question}
            </span>

            {question.type === "mcq" && !question.allow_multiple_answers && (
              <div className="space-y-2">
                {question.options?.map((option, idx) => (
                  <label key={idx} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={responses[question.id] === option}
                      onChange={() => handleResponseChange(question.id, option)}
                      className="text-blue-500 focus:ring-2 focus:ring-blue-300"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === "mcq" && question.allow_multiple_answers && (
              <div className="space-y-2">
                {question.options?.map((option, idx) => (
                  <label key={idx} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={option}
                      checked={responses[question.id]?.includes(option)}
                      onChange={() =>
                        handleMultipleChoiceChange(question.id, option)
                      }
                      className="text-blue-500 focus:ring-2 focus:ring-blue-300"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === "input" && (
              <input
                type="text"
                value={responses[question.id] || ""}
                onChange={(e) =>
                  handleResponseChange(question.id, e.target.value)
                }
                placeholder="Your answer..."
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
