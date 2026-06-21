import ScoreGauge from "~/components/ScoreGauge";
import ScoreBadge from "~/components/ScoreBadge";

const Category = ({
  title,
  score,
  tips
}: {
  title: string;
  score: number;
  tips: any[];
}) => {
  const textColor =
    score > 70
      ? "text-green-600"
      : score > 49
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="resume-summary">
      <div className="category">
        <div className="flex flex-row gap-2 items-center justify-center">
          <p className="text-2xl">{title}</p>
          <ScoreBadge score={score} />
        </div>

        <p className="text-2xl">
          <span className={textColor}>{score}</span>/100
        </p>

        <div className="mt-4">
          {tips?.map((tip, index) => (
            <div
              key={index}
              className="mb-4 p-3 border rounded-lg bg-gray-50"
            >
              <p className="font-semibold">
                {tip.type === "good" ? "✅" : "⚠️"} {tip.tip}
              </p>

              <p className="text-sm text-gray-600 mt-1">
                {tip.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Summary = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md w-full">
      <div className="flex flex-row items-center p-4 gap-8">
        <ScoreGauge score={feedback.overallScore} />

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Your Resume Score</h2>

          <p className="text-sm text-gray-500">
            This score is calculated based on the variables listed below.
          </p>
        </div>
      </div>

      <Category
        title="Tone & Style"
        score={feedback.toneAndStyle.score}
        tips={feedback.toneAndStyle.tips}
      />

      <Category
        title="Content"
        score={feedback.content.score}
        tips={feedback.content.tips}
      />

      <Category
        title="Structure"
        score={feedback.structure.score}
        tips={feedback.structure.tips}
      />

      <Category
        title="Skills"
        score={feedback.skills.score}
        tips={feedback.skills.tips}
      />
    </div>
  );
};

export default Summary;