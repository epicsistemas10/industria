import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

interface ProgressChartProps {
  darkMode: boolean;
}

type Sector = {
  name: string;
  count: number;
  percent: number;
  color: string;
};

export default function ProgressChart({ darkMode }: ProgressChartProps) {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("ordens_servico")
          .select("status");
        if (error) throw error;
        const rows = data ?? [];
        const total = rows.length || 0;

        const counts: Record<string, number> = {};
        for (const r of rows) {
          const key = r.status ?? "Sem status";
          counts[key] = (counts[key] || 0) + 1;
        }

        // Map known statuses to colors and labels. Any unknown status gets a gray color.
        const statusOrder = [
          "Aberta",
          "Em Andamento",
          "Pausada",
          "Concluída",
          "Cancelada",
        ];
        const colorMap: Record<string, string> = {
          Aberta: "bg-blue-500",
          "Em Andamento": "bg-yellow-500",
          Pausada: "bg-orange-500",
          Concluída: "bg-green-500",
          Cancelada: "bg-red-500",
          "Sem status": "bg-gray-400",
        };

        const sectorList: Sector[] = [];
        for (const status of statusOrder) {
          const count = counts[status] || 0;
          const percent = total > 0 ? Math.round((count / total) * 100) : 0;
          sectorList.push({
            name: status,
            count,
            percent,
            color: colorMap[status],
          });
        }

        // include any other statuses not in the predefined order
        for (const key of Object.keys(counts)) {
          if (!statusOrder.includes(key)) {
            const count = counts[key];
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            sectorList.push({
              name: key,
              count,
              percent,
              color: "bg-gray-400",
            });
          }
        }

        if (mounted) setSectors(sectorList);
      } catch (err: any) {
        console.error("Error loading progresso por etapa", err);
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const total = sectors.reduce((s, c) => s + c.count, 0);
  const concluido = sectors.find((s) => s.name === "Concluída")?.count ?? 0;
  const progressoTotal = total > 0 ? Math.round((concluido / total) * 100) : 0;

  return (
    <div
      className={`rounded-xl p-6 ${
        darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
      } border shadow-lg`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3
          className={`text-lg font-semibold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Progresso por Etapa
        </h3>
        <button
          onClick={() => navigate("/equipamentos")}
          className={`text-sm ${
            darkMode
              ? "text-purple-400 hover:text-purple-300"
              : "text-purple-600 hover:text-purple-700"
          } cursor-pointer`}
        >
          Ver detalhes
        </button>
      </div>

      <div className="space-y-4">
        {loading && (
          <div
            className={`text-sm ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Carregando dados...
          </div>
        )}
        {error && <div className="text-sm text-red-500">Erro: {error}</div>}
        {!loading &&
          !error &&
          sectors.map((sector, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {sector.name}
                </span>
                <span
                  className={`text-sm font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {sector.percent}% ({sector.count})
                </span>
              </div>
              <div
                className={`h-2 rounded-full ${
                  darkMode ? "bg-slate-700" : "bg-gray-200"
                }`}
              >
                <div
                  className={`h-full rounded-full ${sector.color} transition-all duration-500`}
                  style={{ width: `${sector.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
      </div>

      <div
        className={`mt-6 pt-4 border-t ${
          darkMode ? "border-slate-700" : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Progresso Total (Concluídas / Total)
          </span>
          <span
            className={`text-2xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {progressoTotal}%
          </span>
        </div>
      </div>
    </div>
  );
}
