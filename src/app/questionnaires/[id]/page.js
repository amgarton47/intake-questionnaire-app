import { supabase } from "@/lib/supabaseClient";

export default async function QuestionnairePage({ params }) {
  const { id } = params;

  // Step 1: Fetch the questionnaire to get its name
  const { data: questionnaire, error: questionnaireError } = await supabase
    .from("questionnaires")
    .select("name")
    .eq("id", id)
    .single();

  if (questionnaireError || !questionnaire) {
    console.error("Error fetching questionnaire:", questionnaireError);
    return <div>Error loading questionnaire details.</div>;
  }

  // Step 2: Get the list of question_ids for this questionnaire
  const { data: questionnaireQuestions, error: questionsError } = await supabase
    .from("questionnaire_questions")
    .select("question_id, priority")
    .eq("questionnaire_id", id)
    .order("priority", { ascending: true });

  if (questionsError || !questionnaireQuestions) {
    console.error("Error fetching questionnaire_questions:", questionsError);
    return <div>Error loading questionnaire questions.</div>;
  }

  if (questionnaireQuestions.length === 0) {
    return <div>No questions found for this questionnaire.</div>;
  }

  const questionIds = questionnaireQuestions.map((q) => q.question_id);

  // Step 3: Fetch the actual questions
  const { data: questionDetails, error: questionsFetchError } = await supabase
    .from("questions")
    .select("id, question, type, options")
    .in("id", questionIds);

  if (questionsFetchError || !questionDetails) {
    console.error("Error fetching questions:", questionsFetchError);
    return <div>Error loading questions.</div>;
  }

  // Optional: sort questionDetails to match priority
  const questionDetailsSorted = questionnaireQuestions.map((q) =>
    questionDetails.find((qd) => qd.id === q.question_id)
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-2">
        Questionnaire: {questionnaire.name}
      </h1>

      <ul className="space-y-8">
        {questionDetailsSorted.map((question, idx) => (
          <li
            key={question.id}
            className="bg-white shadow rounded-lg p-6 space-y-4"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg font-semibold text-gray-700">
                {idx + 1}. {question.question}
              </span>
            </div>
            <p>{question.question}</p>

            {question.type === "mcq" && (
              <div className="space-y-2">
                {question.options?.map((option, idx) => (
                  <label key={idx} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
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
                placeholder="Your answer..."
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
