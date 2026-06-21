import { Link } from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";

const ResumeCard = ({
  resume: { id, companyName, jobTitle, feedback, imagePath },
}: {
  resume: Resume;
}) => {
  const { fs, kv } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState("");

  const handleDelete = async (
  e: React.MouseEvent<HTMLButtonElement>
) => {
  e.preventDefault();
    console.log("Deleting:", id);

  const confirmDelete = window.confirm(
    "Delete this resume report?"
  );

  if (!confirmDelete) return;

  await kv.delete(`resume:${id}`);

  window.location.reload();
};

  useEffect(() => {

    const loadResume = async () => {
      const blob = await fs.read(imagePath);

      if (!blob) return;

      const url = URL.createObjectURL(blob);
      setResumeUrl(url);
    };

    loadResume();
  }, [imagePath, fs]);

  return (
    <Link
      to={`/resume/${id}`}
      className="
  resume-card
  bg-white/60
  backdrop-blur-xl
  border
  border-white/30
  animate-in
  fade-in
  duration-1000
        transition-all
        hover:-translate-y-2
        hover:scale-[1.02]
      "
    >
      <div className="resume-card-header">

        <button
  onClick={handleDelete}
  className="
    absolute
    top-3
    right-3
    text-red-500
hover:text-red-700
font-bold
text-lg
    z-50
  "
>
  ✕
</button>
        <div className="flex flex-col gap-2">
          {companyName ? (
            <h2 className="!text-black font-bold break-words">
              {companyName}
            </h2>
          ) : (
            <h2 className="!text-black font-bold">
              Resume
            </h2>
          )}

          {jobTitle && (
            <h3 className="text-lg break-words text-gray-500">
              {jobTitle}
            </h3>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-medium">
              AI Resume Analysis
            </span>

            <span className="text-xs text-gray-400">
              • Recent
            </span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <ScoreCircle score={feedback?.overallScore || 0} />
        </div>
      </div>

      {resumeUrl && (
        <div className="gradient-border animate-in fade-in duration-1000 overflow-hidden rounded-2xl">
          <div className="w-full h-full">
            <img
              src={resumeUrl}
              alt="resume"
              className="
                w-full
                h-[350px]
                max-sm:h-[200px]
                object-cover
                object-top
                transition-transform
                duration-500
                hover:scale-105
              "
            />
          </div>
        </div>
      )}
    </Link>
  );
};

export default ResumeCard;

