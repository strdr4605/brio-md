"use client";

type Props = {
  level: string;
  setLevel: (val: string) => void;
  instructions: string;
  setInstructions: (val: string) => void;
  guidelines: string;
  setGuidelines: (val: string) => void;
  maxScore: string;
  setMaxScore: (val: string) => void;
  showScore: boolean;
};

export function ResourcePedagogicalFields({
  level,
  setLevel,
  instructions,
  setInstructions,
  guidelines,
  setGuidelines,
  maxScore,
  setMaxScore,
  showScore,
}: Props) {
  return (
    <div className="space-y-3 pt-3 border-t border-slate-100">
      {/* Level */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Nivel Dificultate (Opțional)
        </label>
        <input
          type="text"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          placeholder="ex. Începător / A1 / Clasa a 5-a"
          className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
        />
      </div>

      {/* Instructions & Guidelines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Instrucțiuni Elevi (Opțional)
          </label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Cerințe pentru rezolvare..."
            className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Ghid Profesor (Opțional)
          </label>
          <textarea
            rows={2}
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            placeholder="Indicații metodice..."
            className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white resize-none"
          />
        </div>
      </div>

      {/* Max Score (for worksheets / minigames) */}
      {showScore && (
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Punctaj Maxim
          </label>
          <input
            type="number"
            min={1}
            max={1000}
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            placeholder="100"
            className="w-full sm:w-1/2 text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white"
          />
        </div>
      )}
    </div>
  );
}
